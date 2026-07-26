/**
 * URL del visor noVNC embebido en Sync / Grabación.
 *
 * Preferible (Nginx proxy /vnc/ → :6080):
 *   NEXT_PUBLIC_NOVNC_URL="/vnc/vnc.html"
 *
 * Directo al VPS (puerto 6080 abierto):
 *   NEXT_PUBLIC_NOVNC_URL="http://TU_IP:6080/vnc.html"
 */
export function getNovncViewerUrl() {
  const raw =
    process.env.NEXT_PUBLIC_NOVNC_URL?.trim() || "/vnc/vnc.html"

  return appendNovncParams(raw)
}

function appendNovncParams(href: string) {
  try {
    const isRelative = href.startsWith("/")
    const url = isRelative
      ? new URL(href, "http://placeholder.local")
      : new URL(href)

    if (!url.searchParams.has("autoconnect")) {
      url.searchParams.set("autoconnect", "true")
    }
    if (!url.searchParams.has("resize")) {
      url.searchParams.set("resize", "scale")
    }
    if (!url.searchParams.has("reconnect")) {
      url.searchParams.set("reconnect", "true")
    }

    // path del WebSocket:
    // - página en /vnc/ → preferimos vnc/websockify (mismo prefijo)
    // - además Nginx debe exponer /websockify (ver scripts/nginx-novnc-snippet.conf)
    if (!url.searchParams.has("path")) {
      const underVncProxy =
        isRelative &&
        (url.pathname.startsWith("/vnc/") || url.pathname === "/vnc")
      url.searchParams.set(
        "path",
        underVncProxy ? "vnc/websockify" : "websockify"
      )
    }

    if (isRelative) {
      return `${url.pathname}${url.search}`
    }
    return url.toString()
  } catch {
    return href
  }
}
