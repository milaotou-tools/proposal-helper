#!/usr/bin/env bash
set -euo pipefail
echo "=== env check ==="
echo "KEY_LEN: ${#DEEPSEEK_API_KEY}"
echo "MODEL: ${DEEPSEEK_MODEL:-not-set}"
echo "BASE_URL: ${DEEPSEEK_BASE_URL:-not-set}"

echo ""
echo "=== test simple ==="
curl -s --max-time 15 -X POST "${DEEPSEEK_BASE_URL:-https://api.deepseek.com}/chat/completions" \
  -H "Authorization: Bearer ${DEEPSEEK_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"'"${DEEPSEEK_MODEL:-deepseek-v4-pro}"'","messages":[{"role":"user","content":"hello"}],"temperature":0.35}'

echo ""
echo "=== test with system prompt ==="
curl -s --max-time 15 -X POST "${DEEPSEEK_BASE_URL:-https://api.deepseek.com}/chat/completions" \
  -H "Authorization: Bearer ${DEEPSEEK_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"'"${DEEPSEEK_MODEL:-deepseek-v4-pro}"'","messages":[{"role":"system","content":"你是一名小学教育课题申报指导专家"},{"role":"user","content":"请诊断：测试"}],"temperature":0.35}'

echo ""
echo "=== test review-draft via local API ==="
curl -s --max-time 15 -X POST http://localhost:3005/api/review-draft \
  -H "Content-Type: application/json" \
  -d '{"draft":"测试内容","scope":"整体诊断","allowCollection":false}'
