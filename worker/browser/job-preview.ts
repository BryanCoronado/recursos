import fs from "node:fs/promises"
import path from "node:path"

import type { Page } from "playwright"

/** Captura de la pestaña del job, para que el cliente vea su descarga en vivo. */
const PREVIEW_FILE = "preview.jpg"
const TMP_FILE = "preview.tmp.jpg"

const ENABLED = process.env.WORKER_PREVIEW !== "0"
const INTERVAL_MS = Math.max(
  500,
  Number(process.env.WORKER_PREVIEW_MS ?? 1500)
)

export function jobPreviewPath(downloadDir: string) {
  return path.join(downloadDir, PREVIEW_FILE)
}

/**
 * Guarda un JPEG de la pestaña cada pocos segundos mientras dure el job.
 * Devuelve la función para detenerlo.
 */
export function startJobPreview(page: Page, downloadDir: string) {
  if (!ENABLED) return () => {}

  const target = path.join(downloadDir, PREVIEW_FILE)
  const tmp = path.join(downloadDir, TMP_FILE)
  let stopped = false
  let capturing = false

  const capture = async () => {
    if (stopped || capturing || page.isClosed()) return
    capturing = true
    try {
      const buffer = await page.screenshot({
        type: "jpeg",
        quality: 45,
        timeout: 5_000,
      })
      if (stopped) return
      // Escribimos aparte y renombramos: si la web lee justo en medio, nunca
      // se encuentra un JPEG a medio escribir.
      await fs.writeFile(tmp, buffer)
      await fs.rename(tmp, target)
    } catch {
      // La pestaña puede estar navegando o cerrándose: reintentamos luego.
    } finally {
      capturing = false
    }
  }

  void capture()
  const timer = setInterval(() => {
    void capture()
  }, INTERVAL_MS)
  timer.unref?.()

  return () => {
    if (stopped) return
    stopped = true
    clearInterval(timer)
    void fs.rm(tmp, { force: true }).catch(() => undefined)
    void fs.rm(target, { force: true }).catch(() => undefined)
  }
}
