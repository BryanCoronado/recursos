#!/usr/bin/env bash
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-99}"
VNC_PORT="${VNC_PORT:-5900}"
NOVNC_PORT="${NOVNC_PORT:-6080}"

pkill -f "websockify.*${NOVNC_PORT}" >/dev/null 2>&1 || true
pkill -f "x11vnc.*rfbport ${VNC_PORT}" >/dev/null 2>&1 || true
pkill -f "openbox" >/dev/null 2>&1 || true
pkill -f "Xvfb :${DISPLAY_NUM}" >/dev/null 2>&1 || true

echo "[display] Detenido"
