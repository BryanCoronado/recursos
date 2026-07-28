import type { Page } from "playwright"

const DOWNLOAD_BTN =
  'button:has-text("Descargar"), button:has-text("Download"), a:has-text("Descargar"), a:has-text("Download")'

/**
 * El cliente pega elements.envato.com/… (link público).
 * Con sesión logueada, Envato muestra la UI de app (botón verde Descargar)
 * tras redirect o tras un clic intermedio. Aquí unificamos ese camino.
 */
export async function openEnvatoItemForDownload(page: Page, clientUrl: string) {
  await page.goto(clientUrl, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  })

  // Cookies / banners
  try {
    const accept = page
      .locator('button:has-text("Accept"), button:has-text("Aceptar")')
      .first()
    if (await accept.isVisible({ timeout: 2500 }).catch(() => false)) {
      await accept.click({ timeout: 5000 })
      await page.waitForTimeout(800)
    }
  } catch {
    // ignore
  }

  // Si ya está el Descargar de la app (modal o página), listo
  if (await hasPrimaryDownload(page)) return

  // A veces Elements pide un clic previo que abre app.envato.com / modal
  try {
    const entry = page.locator(DOWNLOAD_BTN).first()
    if (await entry.isVisible({ timeout: 8000 }).catch(() => false)) {
      await entry.click({ timeout: 10_000 })
      await page.waitForTimeout(2000)
    }
  } catch {
    // ignore
  }

  // Esperar UI de descarga (app o modal sobre elements)
  try {
    await page
      .locator(DOWNLOAD_BTN)
      .first()
      .waitFor({ state: "visible", timeout: 45_000 })
  } catch {
    throw new Error(
      "No apareció el botón Descargar tras abrir el link de Elements. " +
        "Revisa la sesión Envato (Sync Listo) o vuelve a grabar la regla " +
        "empezando desde un link elements.envato.com/…"
    )
  }
}

async function hasPrimaryDownload(page: Page) {
  try {
    return await page
      .locator(DOWNLOAD_BTN)
      .first()
      .isVisible({ timeout: 6_000 })
  } catch {
    return false
  }
}
