#!/usr/bin/env bash
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-99}"
VNC_PORT="${VNC_PORT:-5900}"
NOVNC_PORT="${NOVNC_PORT:-6080}"
export DISPLAY=":${DISPLAY_NUM}"

mkdir -p /tmp/recursos-display
cd /tmp/recursos-display

if ! pgrep -f "Xvfb :${DISPLAY_NUM}" >/dev/null 2>&1; then
  echo "[display] Iniciando Xvfb :${DISPLAY_NUM}"
  Xvfb ":${DISPLAY_NUM}" -screen 0 1360x900x24 -ac +extension GLX +render -noreset \
    >"/tmp/recursos-xvfb.log" 2>&1 &
  sleep 1
fi

if ! pgrep -f "openbox" >/dev/null 2>&1; then
  echo "[display] Iniciando openbox"
  DISPLAY=":${DISPLAY_NUM}" openbox >/tmp/recursos-openbox.log 2>&1 &
  sleep 1
fi

if ! pgrep -f "x11vnc.*rfbport ${VNC_PORT}" >/dev/null 2>&1; then
  echo "[display] Iniciando x11vnc :${VNC_PORT}"
  x11vnc -display ":${DISPLAY_NUM}" -forever -shared -rfbport "${VNC_PORT}" -nopw -localhost \
    >/tmp/recursos-x11vnc.log 2>&1 &
  sleep 1
fi

if ! pgrep -f "websockify.*${NOVNC_PORT}" >/dev/null 2>&1; then
  echo "[display] Iniciando noVNC :${NOVNC_PORT}"
  websockify --web=/usr/share/novnc "${NOVNC_PORT}" "localhost:${VNC_PORT}" \
    >/tmp/recursos-novnc.log 2>&1 &
  sleep 1
fi

echo "[display] Listo"
echo "  DISPLAY=${DISPLAY}"
echo "  noVNC: http://TU_IP:${NOVNC_PORT}/vnc.html"
echo "  (mejor protégelo con firewall/Nginx + auth)"
