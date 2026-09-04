import {
  RESOURCE_PROVIDERS,
  getProvider,
  type ResourceProviderId,
} from "../../lib/providers/catalog"
import {
  closeAutomationRecorder,
  isRecorderBrowserOpen,
  listOpenRecorderProviders,
  openAutomationRecorder,
} from "../browser/automation-recorder"
import { downloadProviderResource, DownloadCancelledError } from "../browser/provider-download"
import { withJobLog } from "../browser/job-log"
import {
  closeSharedBrowser,
  listReservedProfiles,
  releaseProfile,
  reserveProfile,
} from "../browser/shared-context"
import {
  closeSyncBrowser,
  isSyncBrowserOpen,
  listOpenSyncProviders,
  openSyncBrowser,
} from "../browser/sync-session"
import { prisma } from "../prisma"
import { availableMemoryMb } from "../system/memory"

/** Descargas en paralelo en todo el worker. */
const MAX_CONCURRENT_DOWNLOADS = Math.max(
  1,
  Number(process.env.WORKER_MAX_DOWNLOADS ?? 2)
)

/**
 * Descargas en paralelo del mismo proveedor. Corren como pestañas del mismo
 * Chromium (una sola cuenta), así que subirlo demasiado arriesga que el
 * proveedor limite la cuenta y consume bastante RAM.
 */
const MAX_PER_PROVIDER = Math.max(
  1,
  Number(
    process.env.WORKER_MAX_DOWNLOADS_PER_PROVIDER ?? MAX_CONCURRENT_DOWNLOADS
  )
)

/**
 * RAM libre mínima (MB) para abrir una pestaña más. Evita que un pico de
 * descargas deje al VPS sin memoria: si el kernel mata Chromium a media
 * descarga puede corromper el perfil y tocaría re-sincronizar la sesión.
 * 0 desactiva el freno.
 */
const MIN_FREE_MEMORY_MB = Math.max(
  0,
  Number(process.env.WORKER_MIN_FREE_MB ?? 500)
)

/** Coste estimado de una pestaña; una página de Envato con video ronda esto. */
const TAB_MEMORY_MB = Math.max(
  50,
  Number(process.env.WORKER_TAB_MEMORY_MB ?? 350)
)

const activeDownloadJobs = new Set<string>()
const activeByProvider = new Map<ResourceProviderId, number>()
const syncOpening = new Set<ResourceProviderId>()
const recorderOpening = new Set<ResourceProviderId>()
const handledSyncAtMs = new Map<ResourceProviderId, number>()
const handledRecordingToken = new Map<ResourceProviderId, string>()

export async function expireMembershipsTick() {
  await prisma.membership.updateMany({
    where: {
      status: "ACTIVE",
      endsAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  })
}

function providersBusyWithUi(): ResourceProviderId[] {
  return [
    ...new Set([
      ...listOpenSyncProviders(),
      ...listOpenRecorderProviders(),
      ...listReservedProfiles(),
    ]),
  ]
}

function activeFor(provider: ResourceProviderId) {
  return activeByProvider.get(provider) ?? 0
}

let lastLowMemoryLogAt = 0

/**
 * La RAM no baja en el instante en que abrimos la pestaña (Chromium tarda
 * segundos en reservarla), así que descontamos a mano lo que ya lanzamos en
 * este tick en vez de volver a medir.
 */
function memoryAllowsStart(availableMb: number, startedThisTick: number) {
  if (MIN_FREE_MEMORY_MB <= 0) return true
  // Con la cola parada siempre dejamos pasar una: si no, con el VPS justo de
  // memoria no se descargaría nunca nada.
  if (activeDownloadJobs.size === 0 && startedThisTick === 0) return true
  const projected = availableMb - startedThisTick * TAB_MEMORY_MB
  return projected - TAB_MEMORY_MB >= MIN_FREE_MEMORY_MB
}

function warnLowMemory(availableMb: number) {
  const now = Date.now()
  if (now - lastLowMemoryLogAt < 30_000) return
  lastLowMemoryLogAt = now
  console.warn(
    `[worker] RAM libre ${availableMb} MB (mínimo ${MIN_FREE_MEMORY_MB} MB): la cola espera en vez de abrir otra pestaña.`
  )
}

type UiOwner = "sync" | "recorder"

const uiClaims = new Map<ResourceProviderId, Set<UiOwner>>()

/**
 * Sync y grabadora usan el mismo perfil que las descargas, y Chromium solo
 * admite un proceso por perfil. Reservamos el perfil para que no entren jobs
 * nuevos y cerramos el navegador de descargas en cuanto se vacíe.
 * Devuelve false mientras queden descargas en curso.
 */
async function claimProfileForUi(provider: ResourceProviderId, owner: UiOwner) {
  const owners = uiClaims.get(provider) ?? new Set<UiOwner>()
  owners.add(owner)
  uiClaims.set(provider, owners)
  reserveProfile(provider)

  if (activeFor(provider) > 0) return false
  await closeSharedBrowser(provider)
  return true
}

function releaseUiClaim(provider: ResourceProviderId, owner: UiOwner) {
  const owners = uiClaims.get(provider)
  if (!owners) return
  owners.delete(owner)
  if (owners.size > 0) return
  uiClaims.delete(provider)
  releaseProfile(provider)
}

export async function processProviderSyncRequests() {
  for (const provider of RESOURCE_PROVIDERS) {
    await processOneProviderSync(provider)
  }
}

async function processOneProviderSync(provider: ResourceProviderId) {
  const def = getProvider(provider)
  const session = await prisma.providerSession.findUnique({
    where: { provider },
  })

  if (!session) return

  if (session.status !== "SYNCING") {
    handledSyncAtMs.delete(provider)
  }

  if (
    session.status === "SYNCING" &&
    !isSyncBrowserOpen(provider) &&
    !syncOpening.has(provider) &&
    handledSyncAtMs.get(provider) !== session.updatedAt.getTime()
  ) {
    if (!(await claimProfileForUi(provider, "sync"))) {
      console.info(
        `[worker] Sync ${def.shortLabel} en espera: ${activeFor(provider)} descarga(s) en curso`
      )
      return
    }

    syncOpening.add(provider)
    try {
      handledSyncAtMs.set(provider, session.updatedAt.getTime())
      await openSyncBrowser(provider)
      console.info(`[worker] Navegador ${def.shortLabel} abierto (sync)`)
    } catch (error) {
      releaseUiClaim(provider, "sync")
      await prisma.providerSession.update({
        where: { provider },
        data: {
          status: "DISCONNECTED",
          lastError: error instanceof Error ? error.message : String(error),
        },
      })
      console.error(`[worker] Error sync ${def.shortLabel}`, error)
    } finally {
      syncOpening.delete(provider)
    }
    return
  }

  if (
    isSyncBrowserOpen(provider) &&
    (session.status === "READY" || session.status === "DISCONNECTED")
  ) {
    await closeSyncBrowser(provider)
    releaseUiClaim(provider, "sync")
    console.info(`[worker] Sync ${def.shortLabel} cerrado`)
    return
  }

  if (
    session.status !== "SYNCING" &&
    !isSyncBrowserOpen(provider) &&
    !syncOpening.has(provider)
  ) {
    releaseUiClaim(provider, "sync")
  }
}

export async function processAutomationRecording() {
  for (const provider of RESOURCE_PROVIDERS) {
    await processOneRecording(provider)
  }
}

async function processOneRecording(provider: ResourceProviderId) {
  const recording = await prisma.automationRecording.findUnique({
    where: { provider },
  })

  if (!recording) return

  if (recording.status !== "RECORDING") {
    handledRecordingToken.delete(provider)
    if (isRecorderBrowserOpen(provider)) {
      await closeAutomationRecorder(provider)
      console.info(`[worker] Grabadora ${provider} cerrada`)
    }
    if (!recorderOpening.has(provider)) releaseUiClaim(provider, "recorder")
    return
  }

  if (
    !isRecorderBrowserOpen(provider) &&
    !recorderOpening.has(provider) &&
    recording.recordToken &&
    handledRecordingToken.get(provider) !== recording.recordToken
  ) {
    if (!(await claimProfileForUi(provider, "recorder"))) {
      console.info(
        `[worker] Grabadora ${provider} en espera: ${activeFor(provider)} descarga(s) en curso`
      )
      return
    }

    recorderOpening.add(provider)
    try {
      handledRecordingToken.set(provider, recording.recordToken)
      await openAutomationRecorder(provider)
    } catch (error) {
      releaseUiClaim(provider, "recorder")
      await prisma.automationRecording.update({
        where: { provider },
        data: {
          status: "IDLE",
          lastError: error instanceof Error ? error.message : String(error),
        },
      })
      console.error(`[worker] Error grabadora ${provider}`, error)
    } finally {
      recorderOpening.delete(provider)
      // openAutomationRecorder puede salir sin abrir (sin sampleUrl, sesión
      // no lista): sin esto el perfil quedaría reservado y nadie descargaría.
      if (!isRecorderBrowserOpen(provider)) {
        releaseUiClaim(provider, "recorder")
      }
    }
  }
}

export async function processQueuedDownloads() {
  const slots = MAX_CONCURRENT_DOWNLOADS - activeDownloadJobs.size
  if (slots <= 0) return

  const busyProviders = new Set<ResourceProviderId>(providersBusyWithUi())
  const available = RESOURCE_PROVIDERS.filter(
    (provider) =>
      !busyProviders.has(provider) && activeFor(provider) < MAX_PER_PROVIDER
  )
  if (available.length === 0) return

  const jobs = await prisma.downloadJob.findMany({
    where: {
      status: "QUEUED",
      provider: { in: [...available] },
      id: { notIn: [...activeDownloadJobs] },
    },
    orderBy: { createdAt: "asc" },
    take: slots,
  })

  // Varias descargas del mismo proveedor van como pestañas del mismo Chromium,
  // hasta MAX_PER_PROVIDER y mientras quede RAM.
  const claimed = new Map<ResourceProviderId, number>()
  const availableMb =
    MIN_FREE_MEMORY_MB > 0 ? availableMemoryMb() : Number.POSITIVE_INFINITY
  let started = 0

  for (const job of jobs) {
    if (started >= slots) break
    const provider = job.provider as ResourceProviderId
    const running = activeFor(provider) + (claimed.get(provider) ?? 0)
    if (running >= MAX_PER_PROVIDER) continue

    if (!memoryAllowsStart(availableMb, started)) {
      warnLowMemory(availableMb)
      break
    }

    claimed.set(provider, (claimed.get(provider) ?? 0) + 1)
    started += 1
    void runDownloadJob(job.id, provider, job.url)
  }
}

async function runDownloadJob(
  jobId: string,
  provider: ResourceProviderId,
  url: string
) {
  if (activeDownloadJobs.has(jobId)) return
  if (activeFor(provider) >= MAX_PER_PROVIDER) return
  if (providersBusyWithUi().includes(provider)) return

  activeDownloadJobs.add(jobId)
  activeByProvider.set(provider, activeFor(provider) + 1)
  const def = getProvider(provider)

  try {
    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        error: null,
        logs: null,
      },
    })

    console.info(
      `[worker] Descargando ${def.shortLabel} job ${jobId} (${activeDownloadJobs.size}/${MAX_CONCURRENT_DOWNLOADS})`
    )

    const outcome = await withJobLog(jobId, () =>
      downloadProviderResource(provider, jobId, url)
    )
    const { logs } = outcome

    if (outcome.error) {
      const current = await prisma.downloadJob.findUnique({
        where: { id: jobId },
        select: { status: true },
      })
      if (current?.status === "FAILED") {
        console.info(`[worker] Job ${jobId} ya finalizado/cancelado`)
        await prisma.downloadJob.update({
          where: { id: jobId },
          data: { logs },
        })
        return
      }

      const err = outcome.error
      const message =
        err instanceof DownloadCancelledError
          ? "Cancelada por el usuario"
          : err instanceof Error
            ? err.message
            : String(err)

      await prisma.downloadJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: message,
          finishedAt: new Date(),
          logs,
        },
      })

      if (
        !(err instanceof DownloadCancelledError) &&
        /sesión|sincroniza|login|sign-in|log-in/i.test(message)
      ) {
        await prisma.providerSession.update({
          where: { provider },
          data: { status: "EXPIRED", lastError: message },
        })
      }

      console.error(`[worker] Job ${jobId} falló`, message)
      return
    }

    const result = outcome.result!
    const stillActive = await prisma.downloadJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    })
    if (!stillActive || stillActive.status !== "RUNNING") {
      console.info(`[worker] Job ${jobId} cancelado; no se marca como OK`)
      await prisma.downloadJob.update({
        where: { id: jobId },
        data: { logs },
      })
      await result.releasePage()
      return
    }

    // Primero DONE en DB (la web deja de “esperar”), luego cerrar la pestaña
    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "DONE",
        category: result.category,
        filePath: result.filePath,
        fileName: result.fileName,
        finishedAt: new Date(),
        error: null,
        logs,
      },
    })
    console.info(`[worker] Job ${jobId} OK: ${result.fileName}`)
    await result.releasePage()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      },
    })
    console.error(`[worker] Job ${jobId} falló`, message)
  } finally {
    activeDownloadJobs.delete(jobId)
    activeByProvider.set(provider, Math.max(0, activeFor(provider) - 1))
  }
}
