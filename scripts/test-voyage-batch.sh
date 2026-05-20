#!/usr/bin/env bash
set -e

if [ -z "$VOYAGE_KEY" ]; then
  echo "Usage: VOYAGE_KEY=<your_key> bash $0" >&2
  exit 1
fi

python3 - <<'PY' > /tmp/voyage-test.json
import json
body = {
  "model": "voyage-multimodal-3",
  "input_type": "document",
  "inputs": [
    {"content": [
      {"type": "text", "text": "Smooche promo buy one get one"},
      {"type": "image_url", "image_url": "https://static-gp.gethookd.ai/media/ads_media/94632744/media-6c30203ac854.jpg"}
    ]},
    {"content": [
      {"type": "text", "text": "Smooche biggest sale of year"},
      {"type": "image_url", "image_url": "https://static-gp.gethookd.ai/media/ads_media/94632772/media-d9c9467f10cb.jpg"}
    ]},
    {"content": [
      {"type": "text", "text": "Smooche color changing foundation"},
      {"type": "image_url", "image_url": "https://static-gp.gethookd.ai/media/ads_media/94632825/media-fc0c7bc17d6c.jpg"}
    ]}
  ]
}
print(json.dumps(body))
PY

curl -sS https://api.voyageai.com/v1/multimodalembeddings \
  -H "Authorization: Bearer ${VOYAGE_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/voyage-test.json \
  | python3 - <<'PY'
import sys, json
r = json.load(sys.stdin)
print("count:", len(r.get("data", [])))
print("dims:", [len(d.get("embedding", [])) for d in r.get("data", [])])
print("usage:", r.get("usage"))
print("error:", r.get("detail") or r.get("error"))
PY
