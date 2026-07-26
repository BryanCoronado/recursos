import { chromium, type BrowserContext } from "playwright"

import { providerProfilePath } from "../../lib/storage/paths"
import { ensureDir } from "./helpers"

const ENVATO_SIGN_IN = "https://elements.envato.com/es/sign-in"

let syncContext: BrowserContext | null = null
let closingIntentionally = false

export function isEnvatoSyncBrowserOpen() {
  return syncContext !== null
}

export async function openEnvatoSyncBrowser() {
  const profilePath = providerProfilePath("envato")
  ensureDir(profilePath)

  if (syncContext) {
    closingIntentionally = true
    try {
      await syncContext.close()
    } catch {
      // ignore
    }
    syncContext = null
    closingIntentionally = false
  }

  syncContext = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    viewport: { width: 1360, height: 900 },
    acceptDownloads: true,
    args: ["--disable-blink-features=AutomationControlled"],
  })

  const page = syncContext.pages()[0] ?? (await syncContext.newPage())
  await page.goto(ENVATO_SIGN_IN, { waitUntil: "domcontentloaded" })

  syncContext.on("close", () => {
    syncContext = null
    if (!closingIntentionally) {
      console.info(
        "[worker] Navegador cerrado. Si ya iniciaste sesión, pulsa «Marcar como listo» en la web. No se reabrirá solo."
      )
    }
  })

  return { profilePath }
}

export async function closeEnvatoSyncBrowser() {
  if (!syncContext) return
  closingIntentionally = true
  try {
    await syncContext.close()
  } catch {
    // ignore
  }
  syncContext = null
  closingIntentionally = false
}
