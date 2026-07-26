/**
 * URL pública del visor noVNC (Chromium del worker).
 * Ejemplos:
 * - https://michitech.digital/vnc/vnc.html
 * - http://127.0.0.1:6080/vnc.html  (solo túnel SSH)
 */
export function getNovncViewerUrl() {
  const base =
    process.env.NEXT_PUBLIC_NOVNC_URL?.trim() ||
    "http://127.0.0.1:6080/vnc.html"

  try {
    const url = new URL(base)
    if (!url.searchParams.has("autoconnect")) {
      url.searchParams.set("autoconnect", "true")
    }
    if (!url.searchParams.has("resize")) {
      url.searchParams.set("resize", "scale")
    }
    return url.toString()
  } catch {
    return base
  }
}
