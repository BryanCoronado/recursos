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
