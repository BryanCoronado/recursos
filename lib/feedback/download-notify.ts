/** Avisos de descarga: título de pestaña + Notification API. */

let titleTimer: number | undefined
let baseTitle = ""

export function rememberDocumentTitle() {
  if (typeof document === "undefined") return
  if (!baseTitle) baseTitle = document.title
}

export function setDownloadTabTitle(
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED" | "IDLE",
  providerLabel: string
) {
  if (typeof document === "undefined") return
  rememberDocumentTitle()
  window.clearTimeout(titleTimer)

  if (status === "IDLE") {
    document.title = baseTitle || document.title
    return
  }

  if (status === "QUEUED" || status === "RUNNING") {
    document.title = `Descargando ${providerLabel}…`
    return
  }

  const prefix = status === "DONE" ? "✓ Lista" : "✗ Falló"
  document.title = `(1) ${prefix} · ${providerLabel}`
  titleTimer = window.setTimeout(() => {
    document.title = baseTitle || "MICHITECH"
  }, 8000)
}

export function flashTabAttention() {
  if (typeof document === "undefined") return
  if (!document.hidden) return
  // Algunos navegadores muestran el título; Notification cubre el resto.
}

export function notifyDownloadBrowser(
  title: string,
  body: string,
  tag?: string
) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        tag: tag ?? "mich-download",
        icon: "/logo-sinfondo-michitech.png",
      })
    } catch {
      // ignore
    }
    return
  }
  if (Notification.permission === "default") {
    void Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        notifyDownloadBrowser(title, body, tag)
      }
    })
  }
}
