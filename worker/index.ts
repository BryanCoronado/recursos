import {
  expireMembershipsTick,
  processAutomationRecording,
  processProviderSyncRequests,
  processQueuedDownloads,
} from "./jobs/processor"
import { prisma } from "./prisma"

const POLL_MS = 2500

async function tick() {
  await expireMembershipsTick()
  await processProviderSyncRequests()
  await processAutomationRecording()
  await processQueuedDownloads()
}

async function main() {
  console.info(
    "[worker] Iniciado. Sync, grabación de reglas y descargas Envato..."
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
