import { pickAutomationRule } from "../../lib/automation/match"
import {
  automationStepsSchema,
  type AutomationStep,
} from "../../lib/automation/types"
import {
  getProvider,
  type ResourceProviderId,
} from "../../lib/providers/catalog"
import { jobDownloadDir, providerProfilePath } from "../../lib/storage/paths"
import { openEnvatoItemForDownload } from "./envato-open-item"
import { detectEnvatoCategory, ensureDir, runAutomationSteps } from "./helpers"
import { jobLog } from "./job-log"
import { launchWorkerContext } from "./launch"
import { prisma } from "../prisma"

function detectCategory(provider: ResourceProviderId, url: string) {
  if (provider === "ENVATO") return detectEnvatoCategory(url)
  return "default"
}

class DownloadCancelledError extends Error {
  constructor() {
    super("Cancelada por el usuario")
    this.name = "DownloadCancelledError"
  }
}

/**
 * Descarga un recurso con el perfil y reglas del proveedor.
 * Si el job pasa a FAILED (cancelación), cierra Chromium.
 */
export async function downloadProviderResource(
  provider: ResourceProviderId,
  jobId: string,
  url: string
) {
  const def = getProvider(provider)
  const session = await prisma.providerSession.findUnique({
    where: { provider },
  })

  if (!session || session.status !== "READY") {
    throw new Error(
      `La sesión de ${def.shortLabel} no está lista. Sincroniza primero.`
    )
  }

  const category = detectCategory(provider, url)
  const rules = await prisma.automationRule.findMany({
    where: { provider, isActive: true },
  })
  jobLog(
    `[download] job=${jobId} provider=${provider} url=${url} category=${category} reglasActivas=${rules.length}`
  )
  for (const r of rules) {
    jobLog(
      `[download]  regla id=${r.id} name="${r.name}" pattern="${r.urlPattern}" category=${r.category} priority=${r.priority}`
    )
  }

  const rule = pickAutomationRule(rules, url, category)

  if (!rule) {
    throw new Error(
      `No hay reglas de automatización activas para ${def.shortLabel}`
    )
  }

  jobLog(
    `[download] regla ELEGIDA id=${rule.id} name="${rule.name}" pattern="${rule.urlPattern}" category=${rule.category}`
  )

  const steps = automationStepsSchema.parse(rule.steps) as AutomationStep[]
  jobLog(`[download] steps=`, steps)
  const profilePath = session.profilePath || providerProfilePath(def.slug)
  const downloadDir = jobDownloadDir(jobId)
  ensureDir(downloadDir)
  jobLog(`[download] profile=${profilePath} downloadDir=${downloadDir}`)

  const context = await launchWorkerContext(profilePath, {
    downloadsPath: downloadDir,
  })
  jobLog(`[download] Chromium lanzado`)

  const cancelWatcher = setInterval(() => {
    void prisma.downloadJob
      .findUnique({
        where: { id: jobId },
        select: { status: true },
      })
      .then((job) => {
        if (job && job.status !== "RUNNING" && job.status !== "QUEUED") {
          void context.close().catch(() => undefined)
        }
      })
      .catch(() => undefined)
  }, 1200)

  const closeBrowser = async () => {
    clearInterval(cancelWatcher)
    await context.close().catch(() => undefined)
    jobLog(`[download] Chromium cerrado`)
  }

  try {
    const stillRunning = await prisma.downloadJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    })
    if (!stillRunning || stillRunning.status !== "RUNNING") {
      await closeBrowser()
      throw new DownloadCancelledError()
    }

    const page = context.pages()[0] ?? (await context.newPage())

    if (provider === "ENVATO") {
      await openEnvatoItemForDownload(page, url)
    } else {
      jobLog(`[download] goto ${url}`)
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 })
      jobLog(`[download] landed ${page.url()}`)
    }

    const result = await runAutomationSteps(page, steps, downloadDir)

    const after = await prisma.downloadJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    })
    if (!after || after.status !== "RUNNING") {
      await closeBrowser()
      throw new DownloadCancelledError()
    }

    // Devolvemos close para marcar DONE en DB ANTES de cerrar el VNC
    return {
      ...result,
      category: rule.urlPattern || rule.category,
      closeBrowser,
    }
  } catch (error) {
    await closeBrowser()
    throw error
  }
}

export async function downloadEnvatoResource(jobId: string, url: string) {
  return downloadProviderResource("ENVATO", jobId, url)
}

export { DownloadCancelledError }
