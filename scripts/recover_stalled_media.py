#!/usr/bin/env python3
"""
Recovers media_url / thumbnail_url / media_type for Smooche ads that have
NULL media (stalled when the original Brand Pull ran out of GetHookd
/media-download credits).

GetHookd's free get_ad endpoint returns the URLs we need. This script
calls it for each stalled ad and patches the ad-intelligence Supabase via
PostgREST.

Reads credentials from (in priority order):
  1. shell env var
  2. .env.local at repo root
  3. .mcp.json `gethookd` server Authorization header (for the GetHookd key)

Required vars (any name in each row works):
  - AD_INTEL_SUPABASE_URL
  - AD_INTEL_SUPABASE_KEY (service role or any key with PATCH on `ads`)
  - GETHOOKED_API_KEY  or  GETHOOKD_API_KEY  (or in .mcp.json)

Usage:
  cd /Users/igordviniatin/Documents/thermoslim-platform
  python3 scripts/recover_stalled_media.py
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import requests


REPO_ROOT = Path(__file__).resolve().parent.parent


def load_env_local() -> None:
    env_file = REPO_ROOT / ".env.local"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k.strip(), v)


def load_gethookd_key_from_mcp() -> str | None:
    mcp_file = REPO_ROOT / ".mcp.json"
    if not mcp_file.exists():
        return None
    try:
        data = json.loads(mcp_file.read_text())
    except json.JSONDecodeError:
        return None
    server = (data.get("mcpServers") or {}).get("gethookd") or {}
    auth = (server.get("headers") or {}).get("Authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        return token or None
    return None


def resolve_gethookd_key() -> tuple[str | None, str]:
    for name in ("GETHOOKED_API_KEY", "GETHOOKD_API_KEY"):
        v = os.environ.get(name)
        if v:
            return v, f"{name} env var"
    if v := load_gethookd_key_from_mcp():
        return v, ".mcp.json gethookd Authorization header"
    return None, "not found"


def fetch_stalled_ad_ids(supa_url: str, supa_key: str) -> list[int]:
    url = f"{supa_url.rstrip('/')}/rest/v1/ads"
    params = {
        "select": "id",
        "media_type": "is.null",
        "media_url": "is.null",
        "order": "id.asc",
    }
    headers = {
        "apikey": supa_key,
        "Authorization": f"Bearer {supa_key}",
        "Accept": "application/json",
        "Prefer": "count=exact",
    }
    r = requests.get(url, params=params, headers=headers, timeout=30)
    r.raise_for_status()
    rows = r.json()
    return [row["id"] for row in rows]


def get_ad(session: requests.Session, ad_id: int) -> dict | None:
    url = f"https://app.gethookd.ai/api/v1/ads/{ad_id}"
    try:
        r = session.get(url, timeout=15)
    except requests.RequestException as e:
        print(f"  [{ad_id}] network error: {e}", file=sys.stderr)
        return None
    if r.status_code != 200:
        print(f"  [{ad_id}] HTTP {r.status_code}: {r.text[:200]}", file=sys.stderr)
        return None
    try:
        body = r.json()
    except ValueError:
        print(f"  [{ad_id}] non-JSON response", file=sys.stderr)
        return None
    if body.get("errors"):
        print(f"  [{ad_id}] api errors: {body.get('errors')}", file=sys.stderr)
        return None
    return body.get("data")


def extract_primary_media(ad: dict) -> tuple[str | None, str | None, str | None]:
    media_list = ad.get("media") or []
    if not media_list:
        return None, None, None
    primary = media_list[0]
    return (
        primary.get("type"),
        primary.get("url"),
        primary.get("thumbnail_url"),
    )


def patch_row(supa_url: str, supa_key: str, ad_id: int, media_type: str,
              media_url: str, thumbnail_url: str | None) -> bool:
    url = f"{supa_url.rstrip('/')}/rest/v1/ads"
    params = {"id": f"eq.{ad_id}", "media_url": "is.null"}
    headers = {
        "apikey": supa_key,
        "Authorization": f"Bearer {supa_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    body = {
        "media_type": media_type,
        "media_url": media_url,
        "thumbnail_url": thumbnail_url or None,
        "updated_at": "now()",
    }
    try:
        r = requests.patch(url, params=params, headers=headers, json=body, timeout=20)
    except requests.RequestException as e:
        print(f"  [{ad_id}] PATCH network error: {e}", file=sys.stderr)
        return False
    if r.status_code not in (200, 204):
        print(f"  [{ad_id}] PATCH HTTP {r.status_code}: {r.text[:200]}", file=sys.stderr)
        return False
    return True


def main() -> int:
    load_env_local()
    supa_url = os.environ.get("AD_INTEL_SUPABASE_URL")
    supa_key = os.environ.get("AD_INTEL_SUPABASE_KEY")
    api_key, key_source = resolve_gethookd_key()

    missing = []
    if not supa_url:
        missing.append("AD_INTEL_SUPABASE_URL")
    if not supa_key:
        missing.append("AD_INTEL_SUPABASE_KEY")
    if missing:
        print(f"ERROR: missing env vars: {', '.join(missing)}", file=sys.stderr)
        return 1
    if not api_key:
        print(
            "ERROR: GetHookd API key not found.\n"
            "  Tried: GETHOOKED_API_KEY, GETHOOKD_API_KEY, .mcp.json gethookd.\n",
            file=sys.stderr,
        )
        return 1

    print(f"Supabase project: {supa_url}")
    print(f"GetHookd key source: {key_source}")

    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {api_key}"})

    try:
        ad_ids = fetch_stalled_ad_ids(supa_url, supa_key)
    except requests.HTTPError as e:
        print(f"ERROR: Supabase fetch failed: {e} — body: {e.response.text[:300]}",
              file=sys.stderr)
        return 1

    print(f"Found {len(ad_ids)} stalled ads to recover.")
    if not ad_ids:
        return 0

    recovered = 0
    no_media: list[int] = []
    fetch_failed: list[int] = []
    patch_failed: list[int] = []

    for idx, ad_id in enumerate(ad_ids, start=1):
        if idx == 1 or idx % 25 == 0:
            print(f"[{idx}/{len(ad_ids)}] processing ad {ad_id}...")
        data = get_ad(session, ad_id)
        if data is None:
            fetch_failed.append(ad_id)
            time.sleep(0.15)
            continue
        media_type, media_url, thumbnail_url = extract_primary_media(data)
        if not media_url:
            no_media.append(ad_id)
            time.sleep(0.12)
            continue
        ok = patch_row(supa_url, supa_key, ad_id,
                       media_type or "image", media_url, thumbnail_url)
        if ok:
            recovered += 1
        else:
            patch_failed.append(ad_id)
        time.sleep(0.12)

    print()
    print(f"Recovered (rows patched): {recovered}")
    print(f"GetHookd had no media for: {len(no_media)}")
    print(f"GetHookd request failures: {len(fetch_failed)}")
    print(f"Supabase patch failures:   {len(patch_failed)}")
    if no_media:
        print(f"  no-media sample: {no_media[:5]}")
    if fetch_failed:
        print(f"  fetch-failed sample: {fetch_failed[:5]}")
    if patch_failed:
        print(f"  patch-failed sample: {patch_failed[:5]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
