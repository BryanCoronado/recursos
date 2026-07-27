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
import {
  closeSyncBrowser,
  isSyncBrowserOpen,
  listOpenSyncProviders,
  openSyncBrowser,
} from "../browser/sync-session"
import { prisma } from "../prisma"

/** Descargas en paralelo entre proveedores; 1 a la vez por perfil Chromium. */
const MAX_CONCURRENT_DOWNLOADS = Math.max(
  1,
  Number(process.env.WORKER_MAX_DOWNLOADS ?? 2)
)

const activeDownloadJobs = new Set<string>()
const activeDownloadProviders = new Set<ResourceProviderId>()
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
    ]),
  ]
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
    syncOpening.add(provider)
    try {
      handledSyncAtMs.set(provider, session.updatedAt.getTime())
      await openSyncBrowser(provider)
      console.info(`[worker] Navegador ${def.shortLabel} abierto (sync)`)
    } catch (error) {
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
    console.info(`[worker] Sync ${def.shortLabel} cerrado`)
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
    return
  }

  if (
    !isRecorderBrowserOpen(provider) &&
    !recorderOpening.has(provider) &&
    recording.recordToken &&
    handledRecordingToken.get(provider) !== recording.recordToken
  ) {
    recorderOpening.add(provider)
    try {
      handledRecordingToken.set(provider, recording.recordToken)
      await openAutomationRecorder(provider)
    } catch (error) {
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
    }
  }
}

export async function processQueuedDownloads() {
  const slots = MAX_CONCURRENT_DOWNLOADS - activeDownloadJobs.size
  if (slots <= 0) return

  const busyProviders = new Set<ResourceProviderId>([
    ...providersBusyWithUi(),
    ...activeDownloadProviders,
  ])

  const jobs = await prisma.downloadJob.findMany({
    where: {
      status: "QUEUED",
      ...(busyProviders.size
        ? { provider: { notIn: [...busyProviders] } }
        : {}),
      id: { notIn: [...activeDownloadJobs] },
    },
    orderBy: { createdAt: "asc" },
    take: slots,
  })

  // Un job por proveedor para no bloquear el user-data-dir de Chromium
  const picked = new Map<ResourceProviderId, (typeof jobs)[number]>()
  for (const job of jobs) {
    const provider = job.provider as ResourceProviderId
    if (picked.has(provider) || busyProviders.has(provider)) continue
    picked.set(provider, job)
  }

  for (const job of picked.values()) {
    void runDownloadJob(job.id, job.provider as ResourceProviderId, job.url)
  }
}

async function runDownloadJob(
  jobId: string,
  provider: ResourceProviderId,
  url: string
) {
  if (activeDownloadJobs.has(jobId)) return
  if (activeDownloadProviders.has(provider)) return
  if (providersBusyWithUi().includes(provider)) return

  activeDownloadJobs.add(jobId)
  activeDownloadProviders.add(provider)
  const def = getProvider(provider)

  try {
    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        error: null,
      },
    })

    console.info(
      `[worker] Descargando ${def.shortLabel} job ${jobId} (${activeDownloadJobs.size}/${MAX_CONCURRENT_DOWNLOADS})`
    )

    const result = await downloadProviderResource(provider, jobId, url)

    const stillActive = await prisma.downloadJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    })
    if (!stillActive || stillActive.status !== "RUNNING") {
      console.info(`[worker] Job ${jobId} cancelado; no se marca como OK`)
      return
    }

    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "DONE",
        category: result.category,
        filePath: result.filePath,
        fileName: result.fileName,
        finishedAt: new Date(),
        error: null,
      },
    })
    console.info(`[worker] Job ${jobId} OK: ${result.fileName}`)
  } catch (error) {
    const current = await prisma.downloadJob.findUnique({
      where: { id: jobId },
      select: { status: true, error: true },
    })
    if (current?.status === "FAILED") {
      console.info(`[worker] Job ${jobId} ya finalizado/cancelado`)
      return
    }

    const message =
      error instanceof DownloadCancelledError
        ? "Cancelada por el usuario"
        : error instanceof Error
          ? error.message
          : String(error)

    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      },
    })

    if (
      !(error instanceof DownloadCancelledError) &&
      /sesión|sincroniza|login|sign-in|log-in/i.test(message)
    ) {
      await prisma.providerSession.update({
        where: { provider },
        data: { status: "EXPIRED", lastError: message },
      })
    }

    console.error(`[worker] Job ${jobId} falló`, message)
  } finally {
    activeDownloadJobs.delete(jobId)
    activeDownloadProviders.delete(provider)
  }
}
