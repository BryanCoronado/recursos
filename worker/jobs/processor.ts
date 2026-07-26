import { downloadEnvatoResource } from "../browser/envato-download"
import {
  closeAutomationRecorder,
  isRecorderBrowserOpen,
  openAutomationRecorder,
} from "../browser/envato-recorder"
import {
  closeEnvatoSyncBrowser,
  isEnvatoSyncBrowserOpen,
  openEnvatoSyncBrowser,
} from "../browser/envato-session"
import { prisma } from "../prisma"

let processing = false
let syncOpening = false
let recorderOpening = false
/** Evita reabrir el navegador si el usuario lo cerró con la X durante el mismo SYNCING. */
let handledSyncAtMs: number | null = null
let handledRecordingToken: string | null = null

export async function processProviderSyncRequests() {
  const session = await prisma.providerSession.findUnique({
    where: { provider: "ENVATO" },
  })

  if (!session) return

  if (session.status !== "SYNCING") {
    handledSyncAtMs = null
  }

  if (
    session.status === "SYNCING" &&
    !isEnvatoSyncBrowserOpen() &&
    !syncOpening &&
    handledSyncAtMs !== session.updatedAt.getTime()
  ) {
    syncOpening = true
    try {
      handledSyncAtMs = session.updatedAt.getTime()
      await openEnvatoSyncBrowser()
      console.info("[worker] Navegador Envato abierto para sincronización")
    } catch (error) {
      await prisma.providerSession.update({
        where: { provider: "ENVATO" },
        data: {
          status: "DISCONNECTED",
          lastError: error instanceof Error ? error.message : String(error),
        },
      })
      console.error("[worker] Error abriendo sync Envato", error)
    } finally {
      syncOpening = false
    }
    return
  }

  if (
    isEnvatoSyncBrowserOpen() &&
    (session.status === "READY" || session.status === "DISCONNECTED")
  ) {
    await closeEnvatoSyncBrowser()
    console.info("[worker] Navegador de sincronización cerrado")
  }
}

export async function processAutomationRecording() {
  const recording = await prisma.automationRecording.findUnique({
    where: { provider: "ENVATO" },
  })

  if (!recording) return

  if (recording.status !== "RECORDING") {
    handledRecordingToken = null
    if (isRecorderBrowserOpen()) {
      await closeAutomationRecorder()
      console.info("[worker] Grabadora cerrada")
    }
    return
  }

  if (
    !isRecorderBrowserOpen() &&
    !recorderOpening &&
    recording.recordToken &&
    handledRecordingToken !== recording.recordToken
  ) {
    recorderOpening = true
    try {
      handledRecordingToken = recording.recordToken
      await openAutomationRecorder()
    } catch (error) {
      await prisma.automationRecording.update({
        where: { provider: "ENVATO" },
        data: {
          status: "IDLE",
          lastError: error instanceof Error ? error.message : String(error),
        },
      })
      console.error("[worker] Error abriendo grabadora", error)
    } finally {
      recorderOpening = false
    }
  }
}

export async function processQueuedDownloads() {
  if (processing) return
  if (isRecorderBrowserOpen() || isEnvatoSyncBrowserOpen()) return
  processing = true

  try {
    const job = await prisma.downloadJob.findFirst({
      where: { status: "QUEUED", provider: "ENVATO" },
      orderBy: { createdAt: "asc" },
    })

    if (!job) return

    await prisma.downloadJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        error: null,
      },
    })

    console.info(`[worker] Descargando job ${job.id}`)

    try {
      const result = await downloadEnvatoResource(job.id, job.url)
      await prisma.downloadJob.update({
        where: { id: job.id },
        data: {
          status: "DONE",
          category: result.category,
          filePath: result.filePath,
          fileName: result.fileName,
          finishedAt: new Date(),
          error: null,
        },
      })
      console.info(`[worker] Job ${job.id} completado: ${result.fileName}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await prisma.downloadJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: message,
          finishedAt: new Date(),
        },
      })

      if (/sesión|sincroniza|login|sign-in/i.test(message)) {
        await prisma.providerSession.update({
          where: { provider: "ENVATO" },
          data: { status: "EXPIRED", lastError: message },
        })
      }

      console.error(`[worker] Job ${job.id} falló`, message)
    }
  } finally {
    processing = false
  }
}
