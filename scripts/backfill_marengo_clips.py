#!/usr/bin/env python3
"""
Backfill Twelve Labs Marengo 3.0 clip-level embeddings into ad_clip_embeddings.

Each video produces N rows (one per 6s clip). Also writes the mean-pooled vector
into ads.embedding_512 for backward compatibility with existing similarity queries.

Setup:
  pip install python-dotenv requests

Env (in .env.local):
  TL_KEY                       # Twelve Labs API key
  AD_INTEL_SUPABASE_URL        # https://fliqklclucdhjemdjatr.supabase.co
  AD_INTEL_SUPABASE_KEY        # service role key (write access)

Usage:
  python3 scripts/backfill_marengo_clips.py --brand 1 --limit 5     # 5-ad smoke test
  python3 scripts/backfill_marengo_clips.py --brand 1               # all pending
"""
from __future__ import annotations

import os
import re
import time
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")

TL_KEY = os.environ["TL_KEY"]
SUPA_URL = os.environ["AD_INTEL_SUPABASE_URL"].rstrip("/")
SUPA_KEY = os.environ["AD_INTEL_SUPABASE_KEY"]

TL_BASE = "https://api.twelvelabs.io/v1.3"
MODEL = "marengo3.0"

SUPA_HEADERS = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

MP4_RE = re.compile(r"\.mp4(\?|$)", re.IGNORECASE)


def pick_video_url(ad: dict) -> str | None:
    apu = ad.get("asset_public_url") or ""
    if MP4_RE.search(apu):
        return apu
    mu = ad.get("media_url") or ""
    if MP4_RE.search(mu):
        return mu
    return None


def to_pgvector(vec: list[float]) -> str:
    return "[" + ",".join(f"{x:.7f}" for x in vec) + "]"


def fetch_pending(brand_id: int, limit: int | None, mode: str = "null-emb") -> list[dict]:
    """
    mode='null-emb' (default): ads with NULL embedding_512 — fresh enrichment
    mode='missing-clips': ads with embedding_512 set but no ad_clip_embeddings rows — legacy mean-pool backfill
    """
    if mode == "missing-clips":
        # Fetch set of ad_ids that already have clip rows
        r = requests.get(
            f"{SUPA_URL}/rest/v1/ad_clip_embeddings",
            headers=SUPA_HEADERS,
            params={"select": "ad_id", "limit": "100000"},
            timeout=30,
        )
        r.raise_for_status()
        have_clips = {row["ad_id"] for row in r.json()}
        # Fetch all video ads for brand with embedding_512 populated
        params = {
            "select": "id,asset_public_url,media_url",
            "brand_id": f"eq.{brand_id}",
            "media_type": "eq.video",
            "embedding_512": "not.is.null",
            "order": "performance_score.desc.nullslast,days_active.desc",
        }
        if limit:
            params["limit"] = str(limit * 5)  # over-fetch since many will be filtered
        r = requests.get(f"{SUPA_URL}/rest/v1/ads", headers=SUPA_HEADERS, params=params, timeout=30)
        r.raise_for_status()
        ads = [a for a in r.json() if a["id"] not in have_clips]
        if limit:
            ads = ads[:limit]
        return ads

    params = {
        "select": "id,asset_public_url,media_url",
        "brand_id": f"eq.{brand_id}",
        "media_type": "eq.video",
        "embedding_512": "is.null",
        "order": "performance_score.desc.nullslast,days_active.desc",
    }
    if limit:
        params["limit"] = str(limit)
    r = requests.get(f"{SUPA_URL}/rest/v1/ads", headers=SUPA_HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def create_task(video_url: str) -> str:
    r = requests.post(
        f"{TL_BASE}/embed/tasks",
        headers={"x-api-key": TL_KEY},
        files={
            "model_name": (None, MODEL),
            "video_url": (None, video_url),
            "embedding_option": (None, "visual"),
        },
        timeout=60,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"create_task failed {r.status_code}: {r.text}")
    return r.json()["_id"]


def poll_task(task_id: str, max_wait_s: int = 300) -> dict:
    deadline = time.time() + max_wait_s
    delay = 5
    while time.time() < deadline:
        r = requests.get(
            f"{TL_BASE}/embed/tasks/{task_id}",
            headers={"x-api-key": TL_KEY},
            timeout=30,
        )
        if r.status_code >= 400:
            raise RuntimeError(f"poll failed {r.status_code}: {r.text}")
        body = r.json()
        status = body.get("status")
        if status == "ready":
            return body
        if status == "failed":
            raise RuntimeError(f"task failed: {body}")
        time.sleep(delay)
    raise TimeoutError(f"task {task_id} not ready after {max_wait_s}s")


def insert_clips(ad_id: int, task_id: str, segments: list[dict]) -> int:
    rows = []
    for idx, seg in enumerate(segments):
        vec = seg.get("float")
        if not isinstance(vec, list):
            continue
        rows.append({
            "ad_id": ad_id,
            "clip_index": idx,
            "embedding_scope": seg.get("embedding_scope", "clip"),
            "start_offset_sec": seg.get("start_offset_sec", 0),
            "end_offset_sec": seg.get("end_offset_sec", 0),
            "embedding": to_pgvector(vec),
            "model_id": MODEL,
            "task_id": task_id,
        })
    if not rows:
        return 0
    r = requests.post(
        f"{SUPA_URL}/rest/v1/ad_clip_embeddings",
        headers={**SUPA_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        params={"on_conflict": "ad_id,clip_index,embedding_scope"},
        json=rows,
        timeout=60,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"insert_clips failed {r.status_code}: {r.text}")
    return len(rows)


def update_ad_mean(ad_id: int, segments: list[dict]) -> None:
    """Mean-pool clip vectors → ads.embedding_512 for back-compat similarity queries."""
    vecs = [s["float"] for s in segments if isinstance(s.get("float"), list)]
    if not vecs:
        return
    dim = len(vecs[0])
    mean = [sum(v[i] for v in vecs) / len(vecs) for i in range(dim)]
    r = requests.patch(
        f"{SUPA_URL}/rest/v1/ads",
        headers=SUPA_HEADERS,
        params={"id": f"eq.{ad_id}"},
        json={"embedding_512": to_pgvector(mean)},
        timeout=30,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"update_ad_mean failed {r.status_code}: {r.text}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand", type=int, default=1, help="brand_id (1 = Smooche)")
    ap.add_argument("--limit", type=int, default=None, help="cap number of ads")
    ap.add_argument("--mode", choices=["null-emb", "missing-clips"], default="null-emb",
                    help="null-emb: ads with NULL embedding_512. missing-clips: ads with emb but no ad_clip_embeddings rows.")
    args = ap.parse_args()

    ads = fetch_pending(args.brand, args.limit, args.mode)
    print(f"Fetched {len(ads)} pending video ads for brand {args.brand} (mode={args.mode})")
    if not ads:
        return

    ok, skipped, failed = 0, 0, 0
    t0 = time.time()

    for i, ad in enumerate(ads, 1):
        ad_id = ad["id"]
        url = pick_video_url(ad)
        if not url:
            print(f"[{i}/{len(ads)}] ad {ad_id}: SKIP — no mp4 URL")
            skipped += 1
            continue

        try:
            print(f"[{i}/{len(ads)}] ad {ad_id}: creating task...", end=" ", flush=True)
            task_id = create_task(url)
            print(f"task={task_id[:12]}... polling...", end=" ", flush=True)
            body = poll_task(task_id)
            segments = body.get("video_embedding", {}).get("segments", [])

            # Diagnostic: show what TL actually returned
            if not segments:
                print(f"\n  WARN: no segments at all. Response keys: {list(body.keys())}")
            else:
                seen_opts = sorted({s.get("embedding_option", "<missing>") for s in segments})
                seen_scopes = sorted({s.get("embedding_scope", "<missing>") for s in segments})
                seen_keys = sorted(segments[0].keys())
                print(
                    f"\n  TL returned {len(segments)} segments | "
                    f"options={seen_opts} | scopes={seen_scopes} | "
                    f"seg keys={seen_keys}"
                )

            clip_segs = [
                s for s in segments
                if s.get("embedding_scope") == "clip"
                and s.get("embedding_option") == "visual"
            ]
            if not clip_segs and segments:
                print(f"  WARN: filter rejected all {len(segments)} segments — re-check field names")
            n_inserted = insert_clips(ad_id, task_id, clip_segs)
            update_ad_mean(ad_id, clip_segs)
            print(f"OK · {n_inserted} clips inserted, mean-pool written")
            ok += 1
        except Exception as e:
            print(f"FAIL: {e}")
            failed += 1

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.0f}s. OK={ok} SKIP={skipped} FAIL={failed} (of {len(ads)})")


if __name__ == "__main__":
    main()
