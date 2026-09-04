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

# Fondo visible (si no, el escritorio vacío se ve negro y parece “roto”)
if command -v xsetroot >/dev/null 2>&1; then
  DISPLAY=":${DISPLAY_NUM}" xsetroot -solid "#1a2740" >/dev/null 2>&1 || true
fi

# Segunda capa además del auth_basic de Nginx: si alguien llega al puerto,
# igual necesita la contraseña. Exporta VNC_PASSWORD antes de ejecutar.
VNC_PASSWD_FILE="${VNC_PASSWD_FILE:-/tmp/recursos-vnc.pass}"
if [ -n "${VNC_PASSWORD:-}" ]; then
  x11vnc -storepasswd "${VNC_PASSWORD}" "${VNC_PASSWD_FILE}" >/dev/null 2>&1
  chmod 600 "${VNC_PASSWD_FILE}"
  VNC_AUTH_ARGS=(-rfbauth "${VNC_PASSWD_FILE}")
else
  VNC_AUTH_ARGS=(-nopw)
fi

if ! pgrep -f "x11vnc.*rfbport ${VNC_PORT}" >/dev/null 2>&1; then
  echo "[display] Iniciando x11vnc :${VNC_PORT}"
  x11vnc -display ":${DISPLAY_NUM}" -forever -shared -rfbport "${VNC_PORT}" \
    "${VNC_AUTH_ARGS[@]}" -localhost \
    >/tmp/recursos-x11vnc.log 2>&1 &
  sleep 1
fi

if [ -z "${VNC_PASSWORD:-}" ]; then
  echo "[display] AVISO: x11vnc sin contraseña. Protege /vnc/ y /websockify"
  echo "          con auth_basic en Nginx (scripts/nginx-novnc-snippet.conf)"
  echo "          o exporta VNC_PASSWORD antes de ejecutar este script."
fi

if ! pgrep -f "websockify.*${NOVNC_PORT}" >/dev/null 2>&1; then
  echo "[display] Iniciando noVNC :${NOVNC_PORT}"
  websockify --web=/usr/share/novnc "${NOVNC_PORT}" "localhost:${VNC_PORT}" \
    >/tmp/recursos-novnc.log 2>&1 &
  sleep 1
fi

echo "[display] Listo"
echo "  DISPLAY=${DISPLAY}"
echo "  noVNC local: http://127.0.0.1:${NOVNC_PORT}/vnc.html"
echo "  Embebido: configura Nginx /vnc/ y NEXT_PUBLIC_NOVNC_URL=/vnc/vnc.html"
echo "  (escritorio vacío = azul oscuro; Chromium aparece al Iniciar sesión / Grabar)"
