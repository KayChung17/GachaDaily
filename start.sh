#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8056}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-5175}"

backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" 2>/dev/null; then
    kill "${frontend_pid}" 2>/dev/null || true
  fi
  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" 2>/dev/null; then
    kill "${backend_pid}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "启动 FastAPI: http://${BACKEND_HOST}:${BACKEND_PORT}"
(
  cd "${ROOT_DIR}/backend"
  uvicorn app.main:app --reload --host "${BACKEND_HOST}" --port "${BACKEND_PORT}"
) &
backend_pid=$!

echo "启动 Vue3: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
(
  cd "${ROOT_DIR}/frontend"
  npm run dev -- --host "${FRONTEND_HOST}" --port "${FRONTEND_PORT}" --strictPort
) &
frontend_pid=$!

wait -n "${backend_pid}" "${frontend_pid}"
