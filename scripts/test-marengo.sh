#!/usr/bin/env bash
# Test Twelve Labs Marengo 3.0 video embedding end-to-end.
# Usage:
#   export TL_KEY="your-twelve-labs-key"
#   ./scripts/test-marengo.sh [optional-video-url]

set -u

if [ -z "${TL_KEY:-}" ]; then
  echo "ERROR: TL_KEY not set. Run: export TL_KEY=\"your-key\""
  exit 1
fi

VIDEO_URL="${1:-https://fliqklclucdhjemdjatr.supabase.co/storage/v1/object/public/ad-assets/smooche/78932354.mp4}"

echo "=== Create task ==="
echo "URL: $VIDEO_URL"
RESPONSE=$(curl -s -X POST https://api.twelvelabs.io/v1.3/embed/tasks \
  -H "x-api-key: $TL_KEY" \
  -F "model_name=marengo3.0" \
  -F "video_url=$VIDEO_URL")
echo "$RESPONSE" | jq .

TASK_ID=$(echo "$RESPONSE" | jq -r '._id // .id // .task_id // empty')
if [ -z "$TASK_ID" ]; then
  echo ""
  echo "ERROR: No task id in response. Inspect the JSON above for the correct field name."
  exit 1
fi
echo ""
echo "TASK_ID=$TASK_ID"
echo ""

echo "=== Polling every 10s (max 3 min) ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18; do
  sleep 10
  STATUS_JSON=$(curl -s -H "x-api-key: $TL_KEY" "https://api.twelvelabs.io/v1.3/embed/tasks/$TASK_ID")
  STATUS=$(echo "$STATUS_JSON" | jq -r '.status // "unknown"')
  ELAPSED=$((i * 10))
  echo "Poll $i (${ELAPSED}s): status=$STATUS"

  if [ "$STATUS" = "ready" ]; then
    echo ""
    echo "=== Vector shape ==="
    echo "$STATUS_JSON" | jq '{
      status,
      model_name,
      segments_count: (.video_embedding.segments | length),
      first_segment: (.video_embedding.segments[0] | {scope: .embedding_scope, dim: (.float | length), start: .start_offset_sec, end: .end_offset_sec})
    }'
    exit 0
  fi

  if [ "$STATUS" = "failed" ]; then
    echo ""
    echo "=== Failure ==="
    echo "$STATUS_JSON" | jq .
    exit 1
  fi
done

echo ""
echo "TIMEOUT after 3 min. Last response:"
echo "$STATUS_JSON" | jq .
exit 1
