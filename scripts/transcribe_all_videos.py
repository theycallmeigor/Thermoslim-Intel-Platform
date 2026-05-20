#!/usr/bin/env python3
"""
Re-transcribe ALL video ads using Gemini, write to Supabase, verify each.

Setup:
  pip install google-genai python-dotenv requests

Env:
  GEMINI_API_KEY            (export before running)
  ts_SUPABASE_URL           (auto-loaded from .env.local)
  ts_SUPABASE_SERVICE_ROLE_KEY (auto-loaded from .env.local)

Usage:
  python3 scripts/transcribe_all_videos.py            # all 74 videos
  python3 scripts/transcribe_all_videos.py --null-only  # only NULL transcripts
  python3 scripts/transcribe_all_videos.py --limit 5    # first N for testing
"""
from __future__ import annotations

import os
import sys
import time
import json
import argparse
import tempfile
import requests
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")

SUPABASE_URL = os.environ["AD_INTEL_SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["AD_INTEL_SUPABASE_KEY"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

PROMPT = (
    "Transcribe ALL spoken words in this video verbatim. "
    "Then identify any prominent on-screen text. "
    "Then write a 2-sentence visual description (talent, setting, key shots). "
    "Return ONLY this JSON, no markdown fences: "
    '{"transcript":"...","on_screen_text":"...","visual_description":"..."}'
)

MIN_CONTENT_LEN = 10  # transcripts shorter than this count as failure

BACKUP_DIR = ROOT / "scripts" / "transcripts"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def fetch_videos(null_only: bool, limit: int | None) -> list[dict]:
    params = {
        "select": "id,brand_name,media_url,drive_ad_folder_id,transcript",
        "media_type": "eq.video",
        "media_url": "not.is.null",
        "order": "id.asc",
    }
    if null_only:
        params["transcript"] = "is.null"
    if limit:
        params["limit"] = str(limit)
    r = requests.get(f"{SUPABASE_URL}/rest/v1/ads", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def download_video(url: str) -> bytes:
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    return r.content


def transcribe(client: genai.Client, video_bytes: bytes, video_id: int) -> dict:
    """Upload video to Gemini Files API, generate transcript, return parsed dict."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(video_bytes)
        tmp_path = f.name
    try:
        uploaded = client.files.upload(file=tmp_path, config=types.UploadFileConfig(mime_type="video/mp4"))
        # Wait for file processing
        while uploaded.state.name == "PROCESSING":
            time.sleep(2)
            uploaded = client.files.get(name=uploaded.name)
        if uploaded.state.name != "ACTIVE":
            return {"_error": f"file state={uploaded.state.name}"}

        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded, PROMPT],
            config=types.GenerateContentConfig(max_output_tokens=2000),
        )

        # Cleanup uploaded file from Gemini
        try:
            client.files.delete(name=uploaded.name)
        except Exception:
            pass

        text = (resp.text or "").strip()
        cleaned = text.replace("```json", "").replace("```", "").strip()
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            parsed = {"transcript": cleaned, "on_screen_text": "", "visual_description": ""}
        return {
            "transcript": (parsed.get("transcript") or "").strip(),
            "on_screen_text": (parsed.get("on_screen_text") or "").strip(),
            "visual_description": (parsed.get("visual_description") or "").strip(),
            "_raw": text,
        }
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def patch_supabase(ad_id: int, payload: dict) -> bool:
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/ads",
        headers={**HEADERS, "Prefer": "return=minimal"},
        params={"id": f"eq.{ad_id}"},
        json=payload,
        timeout=30,
    )
    if not r.ok:
        print(f"    PATCH failed: {r.status_code} {r.text[:200]}")
    return r.ok


def save_backup(ad_id: int, brand: str, result: dict) -> None:
    safe_brand = (brand or "unknown").replace("/", "_")
    fn = BACKUP_DIR / f"{safe_brand}_{ad_id}.txt"
    fn.write_text(
        f"TRANSCRIPT:\n{result['transcript']}\n\n"
        f"ON-SCREEN TEXT:\n{result['on_screen_text']}\n\n"
        f"VISUAL DESCRIPTION:\n{result['visual_description']}\n"
    )


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--null-only", action="store_true", help="Only process rows with NULL transcripts")
    p.add_argument("--limit", type=int, help="Limit to first N videos (testing)")
    args = p.parse_args()

    print(f"[{datetime.now().isoformat(timespec='seconds')}] Fetching videos…")
    videos = fetch_videos(args.null_only, args.limit)
    print(f"  -> {len(videos)} videos to process")
    if not videos:
        return

    client = genai.Client(api_key=GEMINI_API_KEY)

    success = 0
    failed = []
    skipped = []

    for i, ad in enumerate(videos, 1):
        ad_id = ad["id"]
        brand = ad.get("brand_name") or "?"
        url = ad["media_url"]
        had_content = bool((ad.get("transcript") or "").strip())
        print(f"[{i}/{len(videos)}] ad {ad_id} ({brand}) — {'rerun' if had_content else 'first'}")

        try:
            video_bytes = download_video(url)
            print(f"    downloaded {len(video_bytes) // 1024} KB")
        except Exception as e:
            print(f"    DOWNLOAD FAIL: {e}")
            failed.append((ad_id, f"download: {e}"))
            continue

        try:
            result = transcribe(client, video_bytes, ad_id)
        except Exception as e:
            print(f"    GEMINI FAIL: {e}")
            failed.append((ad_id, f"gemini: {e}"))
            continue

        if "_error" in result:
            print(f"    GEMINI ERROR: {result['_error']}")
            failed.append((ad_id, result["_error"]))
            continue

        transcript_text = result["transcript"]
        if len(transcript_text) < MIN_CONTENT_LEN:
            print(f"    EMPTY/SHORT ({len(transcript_text)} chars) — skipping write, leaving NULL")
            skipped.append((ad_id, f"len={len(transcript_text)}"))
            # Reset to NULL so it stays retryable
            patch_supabase(ad_id, {
                "transcript": None,
                "on_screen_text": None,
                "visual_description": None,
                "transcript_written_at": None,
            })
            continue

        ok = patch_supabase(ad_id, {
            "transcript": transcript_text,
            "on_screen_text": result["on_screen_text"],
            "visual_description": result["visual_description"],
            "transcript_written_at": datetime.now(timezone.utc).isoformat(),
        })
        if not ok:
            failed.append((ad_id, "patch failed"))
            continue

        save_backup(ad_id, brand, result)
        print(f"    OK — transcript {len(transcript_text)} chars written")
        success += 1

        # Verify it actually landed
        verify = requests.get(
            f"{SUPABASE_URL}/rest/v1/ads",
            headers=HEADERS,
            params={"select": "transcript", "id": f"eq.{ad_id}"},
            timeout=15,
        ).json()
        if not verify or not (verify[0].get("transcript") or "").strip():
            print(f"    VERIFY FAIL: transcript not in DB after PATCH")
            failed.append((ad_id, "verify"))
            success -= 1

    print()
    print("=" * 60)
    print(f"SUMMARY  ({datetime.now().isoformat(timespec='seconds')})")
    print(f"  Success: {success}")
    print(f"  Skipped (empty Gemini): {len(skipped)}")
    print(f"  Failed: {len(failed)}")
    if failed:
        print("  Failures:")
        for ad_id, reason in failed:
            print(f"    {ad_id}: {reason}")
    if skipped:
        print("  Skipped (will retry next run):")
        for ad_id, reason in skipped:
            print(f"    {ad_id}: {reason}")


if __name__ == "__main__":
    main()
