import type { Page } from "playwright"

import { jobLog } from "./job-log"

const DOWNLOAD_BTN =
  'button:has-text("Descargar"), button:has-text("Download"), a:has-text("Descargar"), a:has-text("Download")'

function log(...parts: unknown[]) {
  jobLog("[envato-open]", ...parts)
}

/**
 * Abre el link del cliente (elements…) y espera el botón Descargar.
 * No pulsa Descargar: eso lo hace la regla (paso download).
 */
export async function openEnvatoItemForDownload(page: Page, clientUrl: string) {
  log(`goto ${clientUrl}`)
  await page.goto(clientUrl, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  })
  log(`después goto url=${page.url()}`)

  try {
    const accept = page
      .locator('button:has-text("Accept"), button:has-text("Aceptar")')
      .first()
    if (await accept.isVisible({ timeout: 2500 }).catch(() => false)) {
      log("clic Accept/Aceptar cookies")
      await accept.click({ timeout: 5000 })
      await page.waitForTimeout(800)
    }
  } catch {
    // ignore
  }

  try {
    await page.waitForURL(/app\.envato\.com|elements\.envato\.com/, {
      timeout: 30_000,
    })
    log(`URL estable url=${page.url()}`)
  } catch {
    log(`waitForURL timeout, url actual=${page.url()}`)
  }

  await page.waitForTimeout(2000)

  try {
    await page
      .locator(DOWNLOAD_BTN)
      .first()
      .waitFor({ state: "visible", timeout: 60_000 })
    const count = await page.locator(DOWNLOAD_BTN).count()
    log(`botón Descargar visible count=${count} url=${page.url()}`)
  } catch {
    log(`NO apareció Descargar url=${page.url()}`)
    throw new Error(
      "No apareció el botón Descargar tras abrir el link de Elements. " +
        "Revisa Sync Envato (Listo) en noVNC."
    )
  }

  await page.waitForTimeout(1200)
  log(`listo para regla de automatización url=${page.url()}`)
}
