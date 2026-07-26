import { type BrowserContext } from "playwright"

import {
  getProvider,
  type ResourceProviderId,
} from "../../lib/providers/catalog"
import { providerProfilePath } from "../../lib/storage/paths"
import { ensureDir } from "./helpers"
import { launchWorkerContext } from "./launch"

/** Una ventana de sync por proveedor (perfiles independientes). */
const syncContexts = new Map<ResourceProviderId, BrowserContext>()
const closingIntentionally = new Set<ResourceProviderId>()

export function isSyncBrowserOpen(provider: ResourceProviderId) {
  return syncContexts.has(provider)
}

export function listOpenSyncProviders(): ResourceProviderId[] {
  return [...syncContexts.keys()]
}

export async function openSyncBrowser(provider: ResourceProviderId) {
  const def = getProvider(provider)
  const profilePath = providerProfilePath(def.slug)
  ensureDir(profilePath)

  const existing = syncContexts.get(provider)
  if (existing) {
    closingIntentionally.add(provider)
    try {
      await existing.close()
    } catch {
      // ignore
    }
    syncContexts.delete(provider)
    closingIntentionally.delete(provider)
  }

  const context = await launchWorkerContext(profilePath)

  syncContexts.set(provider, context)

  const page = context.pages()[0] ?? (await context.newPage())
  await page.goto(def.loginUrl, { waitUntil: "domcontentloaded" })

  context.on("close", () => {
    syncContexts.delete(provider)
    if (!closingIntentionally.has(provider)) {
      console.info(
        `[worker] Navegador ${def.shortLabel} cerrado. Si ya iniciaste sesión, pulsa «Marcar como listo».`
      )
    }
  })

  return { profilePath }
}

export async function closeSyncBrowser(provider: ResourceProviderId) {
  const context = syncContexts.get(provider)
  if (!context) return
  closingIntentionally.add(provider)
  try {
    await context.close()
  } catch {
    // ignore
  }
  syncContexts.delete(provider)
  closingIntentionally.delete(provider)
}

/** @deprecated usar openSyncBrowser("ENVATO") */
export async function openEnvatoSyncBrowser() {
  return openSyncBrowser("ENVATO")
}

/** @deprecated */
export async function closeEnvatoSyncBrowser() {
  return closeSyncBrowser("ENVATO")
}

/** @deprecated */
export function isEnvatoSyncBrowserOpen() {
  return isSyncBrowserOpen("ENVATO")
}
