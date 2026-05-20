#!/usr/bin/env python3
"""
Backfill embedding_1024 column using Voyage voyage-3-large.

Setup:
  pip install python-dotenv requests

Env (in .env.local):
  VOYAGE_API_KEY
  AD_INTEL_SUPABASE_URL
  AD_INTEL_SUPABASE_KEY

Usage:
  python3 scripts/backfill_voyage_embeddings.py            # all pending
  python3 scripts/backfill_voyage_embeddings.py --limit 5  # test first
  python3 scripts/backfill_voyage_embeddings.py --batch 64 # texts per Voyage call
"""
from __future__ import annotations

import os
import json
import argparse
import requests
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")

SUPABASE_URL = os.environ["AD_INTEL_SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["AD_INTEL_SUPABASE_KEY"]
VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]

VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"
MODEL = "voyage-3-large"
DIM = 1024
MAX_INPUT_CHARS = 12000  # truncate very long embedding_text to stay under Voyage token limit

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def fetch_pending(limit: int | None) -> list[dict]:
    params = {
        "select": "id,embedding_text",
        "embedding_text": "not.is.null",
        "embedding_1024": "is.null",
        "order": "id.asc",
    }
    if limit:
        params["limit"] = str(limit)
    r = requests.get(f"{SUPABASE_URL}/rest/v1/ads", headers=SB_HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def voyage_embed(texts: list[str]) -> list[list[float]]:
    payload = {
        "input": texts,
        "model": MODEL,
        "output_dimension": DIM,
        "input_type": "document",
    }
    r = requests.post(
        VOYAGE_URL,
        headers={
            "Authorization": f"Bearer {VOYAGE_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )
    if not r.ok:
        raise RuntimeError(f"Voyage {r.status_code}: {r.text[:300]}")
    data = r.json().get("data", [])
    return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]


def patch_row(ad_id: int, vector: list[float]) -> bool:
    vec_str = "[" + ",".join(f"{v:.7f}" for v in vector) + "]"
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/ads",
        headers={**SB_HEADERS, "Prefer": "return=minimal"},
        params={"id": f"eq.{ad_id}"},
        json={
            "embedding_1024": vec_str,
            "embedding_model": MODEL,
            "embedding_1024_written_at": datetime.now(timezone.utc).isoformat(),
        },
        timeout=30,
    )
    if not r.ok:
        print(f"    PATCH {ad_id} failed: {r.status_code} {r.text[:200]}")
    return r.ok


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, help="Process only first N rows")
    p.add_argument("--batch", type=int, default=64, help="Texts per Voyage request (default 64)")
    args = p.parse_args()

    print(f"[{datetime.now().isoformat(timespec='seconds')}] Fetching pending ads…")
    rows = fetch_pending(args.limit)
    print(f"  -> {len(rows)} rows pending embedding_1024")
    if not rows:
        return

    success = 0
    failed: list[tuple[int, str]] = []

    for offset in range(0, len(rows), args.batch):
        chunk = rows[offset : offset + args.batch]
        chunk_ids = [r["id"] for r in chunk]
        chunk_texts = [(r["embedding_text"] or "")[:MAX_INPUT_CHARS] for r in chunk]
        print(f"[{offset + 1}-{offset + len(chunk)}/{len(rows)}] calling Voyage on {len(chunk)} texts…")

        try:
            vectors = voyage_embed(chunk_texts)
        except Exception as e:
            print(f"    Voyage call failed: {e}")
            for ad_id in chunk_ids:
                failed.append((ad_id, str(e)))
            continue

        if len(vectors) != len(chunk):
            print(f"    expected {len(chunk)} vectors, got {len(vectors)} — skipping chunk")
            for ad_id in chunk_ids:
                failed.append((ad_id, "vector count mismatch"))
            continue

        for ad_id, vec in zip(chunk_ids, vectors):
            if len(vec) != DIM:
                failed.append((ad_id, f"dim {len(vec)} != {DIM}"))
                continue
            if patch_row(ad_id, vec):
                success += 1
            else:
                failed.append((ad_id, "patch failed"))

        print(f"    chunk done — running success={success}")

    print()
    print("=" * 60)
    print(f"SUMMARY  ({datetime.now().isoformat(timespec='seconds')})")
    print(f"  Success: {success}")
    print(f"  Failed: {len(failed)}")
    if failed:
        print("  Failures:")
        for ad_id, reason in failed[:20]:
            print(f"    {ad_id}: {reason}")
        if len(failed) > 20:
            print(f"    ... and {len(failed) - 20} more")


if __name__ == "__main__":
    main()
