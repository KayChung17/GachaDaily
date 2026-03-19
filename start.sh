#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8056}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-5175}"

backend_pid=""
frontend_pid=""
CURRENT_USER="$(id -un)"

kill_process_group() {
  local pid="$1"
  local pgid=""

  [[ -n "${pid}" ]] || return 0
  kill -0 "${pid}" 2>/dev/null || return 0

  pgid="$(ps -o pgid= -p "${pid}" 2>/dev/null | tr -d ' ')"
  [[ -n "${pgid}" ]] || return 0

  # Only kill the group when this pid is its leader, to avoid touching the caller's shell group.
  if [[ "${pgid}" == "${pid}" ]]; then
    kill -"${pgid}" 2>/dev/null || true
  fi
}

kill_process_tree() {
  local pid="$1"
  local -a children=()

  [[ -n "${pid}" ]] || return 0
  kill -0 "${pid}" 2>/dev/null || return 0

  if command -v pgrep >/dev/null 2>&1; then
    mapfile -t children < <(pgrep -P "${pid}" 2>/dev/null || true)
    for child in "${children[@]}"; do
      kill_process_tree "${child}"
    done
  fi

  kill "${pid}" 2>/dev/null || true
}

list_listening_pids() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null | sort -u || true
    return 0
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :${port}" 2>/dev/null \
      | grep -oE 'pid=[0-9]+' \
      | cut -d= -f2 \
      | sort -u || true
  fi
}

kill_service() {
  local pid="$1"

  [[ -n "${pid}" ]] || return 0
  kill_process_group "${pid}"
  kill_process_tree "${pid}"
}

ensure_port_available() {
  local port="$1"
  local service_name="$2"
  local -a pids=()
  local -a remaining_pids=()
  local pid=""
  local owner=""
  local attempt=0

  mapfile -t pids < <(list_listening_pids "${port}")
  [[ "${#pids[@]}" -eq 0 ]] && return 0

  echo "检测到 ${service_name} 端口 ${port} 已被占用，正在清理当前用户旧进程..."

  for pid in "${pids[@]}"; do
    owner="$(ps -o user= -p "${pid}" 2>/dev/null | awk '{print $1}')"
    [[ -n "${owner}" ]] || continue

    if [[ "${owner}" != "${CURRENT_USER}" ]]; then
      echo "端口 ${port} 被用户 ${owner} 的进程 ${pid} 占用，当前脚本不会强制结束它。"
      return 1
    fi
  done

  for pid in "${pids[@]}"; do
    kill_service "${pid}"
  done

  while (( attempt < 20 )); do
    mapfile -t remaining_pids < <(list_listening_pids "${port}")
    [[ "${#remaining_pids[@]}" -eq 0 ]] && return 0
    sleep 0.2
    ((attempt += 1))
  done

  echo "端口 ${port} 仍被占用，请手动检查后再启动。"
  return 1
}

cleanup() {
  set +e
  kill_service "${frontend_pid}"
  kill_service "${backend_pid}"
  wait "${frontend_pid}" "${backend_pid}" 2>/dev/null || true
}
trap cleanup EXIT
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM

ensure_port_available "${BACKEND_PORT}" "FastAPI"
ensure_port_available "${FRONTEND_PORT}" "Vue3"

echo "启动 FastAPI: http://${BACKEND_HOST}:${BACKEND_PORT}"
setsid bash -lc '
  cd "$1"
  exec uvicorn app.main:app --reload --host "$2" --port "$3"
' bash "${ROOT_DIR}/backend" "${BACKEND_HOST}" "${BACKEND_PORT}" &
backend_pid=$!

echo "启动 Vue3: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
setsid bash -lc '
  cd "$1"
  exec npm run dev -- --host "$2" --port "$3" --strictPort
' bash "${ROOT_DIR}/frontend" "${FRONTEND_HOST}" "${FRONTEND_PORT}" &
frontend_pid=$!

wait -n "${backend_pid}" "${frontend_pid}"
exit_code=$?
cleanup
exit "${exit_code}"
