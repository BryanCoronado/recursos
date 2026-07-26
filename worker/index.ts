import { existsSync } from "node:fs"

import {
  expireMembershipsTick,
  processAutomationRecording,
  processProviderSyncRequests,
  processQueuedDownloads,
} from "./jobs/processor"
import { prisma } from "./prisma"

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
  console.info(
    `[worker] Iniciado. Providers: Envato + Magnific. Descargas paralelas: hasta ${max}.`
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

process.on("SIGINT", async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await prisma.$disconnect()
  process.exit(0)
})
