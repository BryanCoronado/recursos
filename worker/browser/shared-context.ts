import type { BrowserContext, Page } from "playwright"

import { type ResourceProviderId } from "../../lib/providers/catalog"
import { ensureDir } from "./helpers"
import { launchWorkerContext } from "./launch"

/**
 * Un solo Chromium por proveedor, con una pestaña por descarga.
 *
 * El perfil persistente (`storage/browser/<proveedor>`) guarda la sesión del
 * proveedor y Chromium lo bloquea a nivel de proceso, así que no se pueden
 * abrir dos navegadores sobre él. Compartiendo el proceso y abriendo pestañas
 * sí podemos correr varias descargas a la vez con la misma cuenta.
 */

/** Cierra el navegador tras este tiempo sin descargas (libera RAM y el perfil). */
const IDLE_CLOSE_MS = Math.max(
  5_000,
  Number(process.env.WORKER_BROWSER_IDLE_MS ?? 120_000)
)

type Entry = {
  context: BrowserContext
  leases: number
  idleTimer: NodeJS.Timeout | null
}

const entries = new Map<ResourceProviderId, Entry>()
const launching = new Map<ResourceProviderId, Promise<Entry>>()
/** Perfiles tomados por la UI admin (sync / grabadora): no abrir descargas. */
const reserved = new Set<ResourceProviderId>()

export type PageLease = {
  page: Page
  /** Cierra la pestaña del job (y sus popups) y libera el slot. */
  release: () => Promise<void>
}

export function listReservedProfiles(): ResourceProviderId[] {
  return [...reserved]
}

export function isProfileReserved(provider: ResourceProviderId) {
  return reserved.has(provider)
}

export function reserveProfile(provider: ResourceProviderId) {
  reserved.add(provider)
}

export function releaseProfile(provider: ResourceProviderId) {
  reserved.delete(provider)
}

export function isSharedBrowserOpen(provider: ResourceProviderId) {
  return entries.has(provider)
}

export function openPagesFor(provider: ResourceProviderId) {
  return entries.get(provider)?.leases ?? 0
}

export async function closeSharedBrowser(provider: ResourceProviderId) {
  const entry = entries.get(provider)
  if (!entry) return
  if (entry.idleTimer) clearTimeout(entry.idleTimer)
  entries.delete(provider)
  await entry.context.close().catch(() => undefined)
}

export async function closeAllSharedBrowsers() {
  await Promise.all([...entries.keys()].map((p) => closeSharedBrowser(p)))
}

function scheduleIdleClose(provider: ResourceProviderId) {
  const entry = entries.get(provider)
  if (!entry || entry.leases > 0) return
  if (entry.idleTimer) clearTimeout(entry.idleTimer)
  entry.idleTimer = setTimeout(() => {
    const current = entries.get(provider)
    if (!current || current.leases > 0) return
    void closeSharedBrowser(provider)
  }, IDLE_CLOSE_MS)
  entry.idleTimer.unref?.()
}

async function getOrLaunch(
  provider: ResourceProviderId,
  profilePath: string
): Promise<Entry> {
  const existing = entries.get(provider)
  if (existing) return existing

  const pending = launching.get(provider)
  if (pending) return pending

  const promise = (async () => {
    ensureDir(profilePath)
    // Sin downloadsPath: cada job guarda con download.saveAs() en su carpeta.
    const context = await launchWorkerContext(profilePath)
    const entry: Entry = { context, leases: 0, idleTimer: null }
    context.on("close", () => {
      if (entry.idleTimer) clearTimeout(entry.idleTimer)
      if (entries.get(provider) === entry) entries.delete(provider)
    })
    entries.set(provider, entry)
    return entry
  })()

  launching.set(provider, promise)
  try {
    return await promise
  } finally {
    launching.delete(provider)
  }
}

/**
 * Abre una pestaña para un job. La primera pestaña del contexto se deja
 * siempre en blanco: si cerráramos la última, Chromium terminaría el proceso.
 */
export async function acquireProviderPage(
  provider: ResourceProviderId,
  profilePath: string
): Promise<PageLease> {
  if (reserved.has(provider)) {
    throw new Error(
      "El perfil está en uso por la sincronización o la grabadora. Intenta en unos segundos."
    )
  }

  const entry = await getOrLaunch(provider, profilePath)
  entry.leases += 1
  if (entry.idleTimer) {
    clearTimeout(entry.idleTimer)
    entry.idleTimer = null
  }

  let page: Page
  try {
    page = await entry.context.newPage()
  } catch (error) {
    entry.leases = Math.max(0, entry.leases - 1)
    scheduleIdleClose(provider)
    throw error
  }

  const owned = new Set<Page>([page])
  function trackPopup(child: Page) {
    owned.add(child)
    child.on("popup", trackPopup)
  }
  page.on("popup", trackPopup)

  let released = false
  const release = async () => {
    if (released) return
    released = true
    for (const target of owned) {
      if (!target.isClosed()) await target.close().catch(() => undefined)
    }
    entry.leases = Math.max(0, entry.leases - 1)
    if (entry.leases === 0) scheduleIdleClose(provider)
  }

  return { page, release }
}
