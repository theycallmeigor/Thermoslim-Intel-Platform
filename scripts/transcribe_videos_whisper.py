#!/usr/bin/env python3
"""
Local transcription using MLX Whisper (Apple Silicon, large-v3-turbo).
Free, unlimited, no API quotas.

Setup (one-time):
  pip install mlx-whisper python-dotenv requests
  brew install ffmpeg

Env (in .env.local):
  AD_INTEL_SUPABASE_URL
  AD_INTEL_SUPABASE_KEY

Usage:
  python3 scripts/transcribe_videos_whisper.py              # ALL videos
  python3 scripts/transcribe_videos_whisper.py --null-only  # only NULL
  python3 scripts/transcribe_videos_whisper.py --limit 5    # first N (testing)
"""
from __future__ import annotations

import os
import sys
import json
import argparse
import tempfile
import subprocess
import requests
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
import mlx_whisper

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")

SUPABASE_URL = os.environ["AD_INTEL_SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["AD_INTEL_SUPABASE_KEY"]

WHISPER_MODEL = "mlx-community/whisper-large-v3-turbo"
MIN_CONTENT_LEN = 10

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

BACKUP_DIR = ROOT / "scripts" / "transcripts"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def fetch_videos(null_only: bool, limit: int | None) -> list[dict]:
    params = {
        "select": "id,brand_name,media_url,transcript",
        "media_type": "eq.video",
        "media_url": "not.is.null",
        "order": "id.asc",
    }
    if null_only:
        params["or"] = "(transcript.is.null,transcript.eq.)"
    if limit:
        params["limit"] = str(limit)
    r = requests.get(f"{SUPABASE_URL}/rest/v1/ads", headers=SB_HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def download_video(url: str, dest: Path) -> None:
    r = requests.get(url, stream=True, timeout=180)
    r.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in r.iter_content(8192):
            f.write(chunk)


def extract_audio(video_path: Path, audio_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(video_path),
            "-vn", "-ac", "1", "-ar", "16000",
            "-c:a", "pcm_s16le",
            str(audio_path),
        ],
        check=True,
    )


def transcribe(audio_path: Path) -> str:
    result = mlx_whisper.transcribe(str(audio_path), path_or_hf_repo=WHISPER_MODEL)
    return (result.get("text") or "").strip()


def patch_supabase(ad_id: int, transcript: str) -> bool:
    payload = {
        "transcript": transcript,
        "transcript_written_at": datetime.now(timezone.utc).isoformat(),
    }
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/ads",
        headers={**SB_HEADERS, "Prefer": "return=minimal"},
        params={"id": f"eq.{ad_id}"},
        json=payload,
        timeout=30,
    )
    if not r.ok:
        print(f"    PATCH failed: {r.status_code} {r.text[:200]}")
    return r.ok


def save_backup(ad_id: int, brand: str, transcript: str) -> None:
    safe_brand = (brand or "unknown").replace("/", "_")
    fn = BACKUP_DIR / f"{safe_brand}_{ad_id}.txt"
    fn.write_text(transcript)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--null-only", action="store_true")
    p.add_argument("--limit", type=int)
    args = p.parse_args()

    print(f"[{datetime.now().isoformat(timespec='seconds')}] Fetching videos…", flush=True)
    videos = fetch_videos(args.null_only, args.limit)
    print(f"  -> {len(videos)} videos to process", flush=True)
    if not videos:
        return

    success = 0
    failed: list[tuple[int, str]] = []
    skipped: list[tuple[int, str]] = []

    for i, ad in enumerate(videos, 1):
        ad_id = ad["id"]
        brand = ad.get("brand_name") or "?"
        url = ad["media_url"]
        had_content = bool((ad.get("transcript") or "").strip())
        print(f"[{i}/{len(videos)}] ad {ad_id} ({brand}) — {'rerun' if had_content else 'first'}", flush=True)

        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_p = Path(tmpdir)
            video_path = tmpdir_p / "video.mp4"
            audio_path = tmpdir_p / "audio.wav"

            try:
                download_video(url, video_path)
                size_kb = video_path.stat().st_size // 1024
                print(f"    downloaded {size_kb} KB", flush=True)
            except Exception as e:
                print(f"    DOWNLOAD FAIL: {e}", flush=True)
                failed.append((ad_id, f"download: {e}"))
                continue

            try:
                extract_audio(video_path, audio_path)
            except subprocess.CalledProcessError as e:
                print(f"    FFMPEG FAIL: {e}", flush=True)
                failed.append((ad_id, f"ffmpeg: {e}"))
                continue

            try:
                text = transcribe(audio_path)
            except Exception as e:
                print(f"    WHISPER FAIL: {e}", flush=True)
                failed.append((ad_id, f"whisper: {e}"))
                continue

            if len(text) < MIN_CONTENT_LEN:
                print(f"    EMPTY/SHORT ({len(text)} chars) — leaving NULL", flush=True)
                skipped.append((ad_id, f"len={len(text)}"))
                # Reset to NULL so it stays retryable
                patch_supabase(ad_id, None) if False else None  # leave row untouched
                continue

            if not patch_supabase(ad_id, text):
                failed.append((ad_id, "patch failed"))
                continue

            save_backup(ad_id, brand, text)
            print(f"    OK — {len(text)} chars", flush=True)
            success += 1

    print(flush=True)
    print("=" * 60, flush=True)
    print(f"SUMMARY  ({datetime.now().isoformat(timespec='seconds')})", flush=True)
    print(f"  Success: {success}", flush=True)
    print(f"  Skipped: {len(skipped)}", flush=True)
    print(f"  Failed: {len(failed)}", flush=True)
    if failed:
        for ad_id, reason in failed[:20]:
            print(f"    {ad_id}: {reason}", flush=True)
    if skipped:
        print("  Empty/short (left as-is):", flush=True)
        for ad_id, reason in skipped[:20]:
            print(f"    {ad_id}: {reason}", flush=True)


if __name__ == "__main__":
    main()
