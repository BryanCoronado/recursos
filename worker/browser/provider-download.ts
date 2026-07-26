import { chromium } from "playwright"

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
import { detectEnvatoCategory, ensureDir, runAutomationSteps } from "./helpers"
import { ensureWorkerDisplay } from "./display"
import { prisma } from "../prisma"

function detectCategory(provider: ResourceProviderId, url: string) {
  if (provider === "ENVATO") return detectEnvatoCategory(url)
  return "default"
}

/**
 * Descarga un recurso con el perfil y reglas del proveedor.
 * Cada job abre su propia ventana Playwright (concurrencia vía processor).
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
  const rule = pickAutomationRule(rules, url, category)

  if (!rule) {
    throw new Error(
      `No hay reglas de automatización activas para ${def.shortLabel}`
    )
  }

  const steps = automationStepsSchema.parse(rule.steps) as AutomationStep[]
  const profilePath = session.profilePath || providerProfilePath(def.slug)
  const downloadDir = jobDownloadDir(jobId)
  ensureDir(downloadDir)
  ensureWorkerDisplay()

  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    acceptDownloads: true,
    viewport: { width: 1360, height: 900 },
    downloadsPath: downloadDir,
    args: ["--disable-blink-features=AutomationControlled"],
  })

  try {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 })
    const result = await runAutomationSteps(page, steps, downloadDir)

    return {
      ...result,
      category: rule.urlPattern || rule.category,
    }
  } finally {
    await context.close()
  }
}

export async function downloadEnvatoResource(jobId: string, url: string) {
  return downloadProviderResource("ENVATO", jobId, url)
}
