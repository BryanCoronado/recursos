import { existsSync } from "node:fs"

import { closeAllSharedBrowsers } from "./browser/shared-context"
import {
  expireMembershipsTick,
  processAutomationRecording,
  processProviderSyncRequests,
  processQueuedDownloads,
} from "./jobs/processor"
import { prisma } from "./prisma"
import { availableMemoryMb } from "./system/memory"

const POLL_MS = 2500

/** Chromium headed necesita Xvfb. Por defecto :99 (scripts/start-display.sh). */
function ensureDisplay() {
  if (!process.env.DISPLAY) {
    process.env.DISPLAY = ":99"
  }
  const display = process.env.DISPLAY
  const xLock = display.replace(/^:/, "")
  const lockPath = `/tmp/.X${xLock}-lock`
  if (!existsSync(lockPath)) {
    console.warn(
      `[worker] DISPLAY=${display} pero no hay Xvfb (falta ${lockPath}). Ejecuta: bash scripts/start-display.sh`
    )
  } else {
    console.info(`[worker] DISPLAY=${display} (Xvfb OK)`)
  }
}

async function tick() {
  await expireMembershipsTick()
  await processProviderSyncRequests()
  await processAutomationRecording()
  await processQueuedDownloads()
}

async function main() {
  ensureDisplay()
  const max = process.env.WORKER_MAX_DOWNLOADS ?? "2"
  const perProvider = process.env.WORKER_MAX_DOWNLOADS_PER_PROVIDER ?? max
  const minFreeMb = process.env.WORKER_MIN_FREE_MB ?? "500"
  console.info(
    `[worker] Iniciado. Providers: Envato + Magnific. Descargas paralelas: hasta ${max} (${perProvider} por proveedor, en pestañas del mismo Chromium).`
  )
  console.info(
    `[worker] RAM disponible ${availableMemoryMb()} MB; freno de cola bajo ${minFreeMb} MB libres.`
  )
  await tick()
  setInterval(() => {
    void tick()
  }, POLL_MS)
}

main().catch(async (error) => {
  console.error("[worker] Error fatal", error)
  await prisma.$disconnect()
  process.exit(1)
})

async function shutdown() {
  await closeAllSharedBrowsers().catch(() => undefined)
  await prisma.$disconnect()
  process.exit(0)
}

process.on("SIGINT", () => {
  void shutdown()
})

process.on("SIGTERM", () => {
  void shutdown()
})
