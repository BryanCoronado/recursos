/**
 * URL del visor noVNC embebido en Sync / Grabación.
 *
 * Preferible ruta relativa (mismo dominio vía Nginx):
 *   NEXT_PUBLIC_NOVNC_URL="/vnc/vnc.html"
 *
 * Alternativa directa al VPS (puerto 6080 abierto):
 *   NEXT_PUBLIC_NOVNC_URL="http://38.250.161.192:6080/vnc.html"
 *
 * 127.0.0.1 solo sirve con túnel SSH desde tu PC — en el navegador
 * del usuario apunta a su máquina, no al servidor.
 */
export function getNovncViewerUrl() {
  const raw =
    process.env.NEXT_PUBLIC_NOVNC_URL?.trim() || "/vnc/vnc.html"

  return appendNovncParams(raw)
}

function appendNovncParams(href: string) {
  try {
    if (href.startsWith("/")) {
      const url = new URL(href, "http://placeholder.local")
      if (!url.searchParams.has("autoconnect")) {
        url.searchParams.set("autoconnect", "true")
      }
      if (!url.searchParams.has("resize")) {
        url.searchParams.set("resize", "scale")
      }
      return `${url.pathname}${url.search}`
    }

    const url = new URL(href)
    if (!url.searchParams.has("autoconnect")) {
      url.searchParams.set("autoconnect", "true")
    }
    if (!url.searchParams.has("resize")) {
      url.searchParams.set("resize", "scale")
    }
    return url.toString()
  } catch {
    return href
  }
}
