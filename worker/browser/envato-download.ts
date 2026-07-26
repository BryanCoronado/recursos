import { chromium } from "playwright"

import { pickAutomationRule } from "../../lib/automation/match"
import {
  automationStepsSchema,
  type AutomationStep,
} from "../../lib/automation/types"
import { jobDownloadDir, providerProfilePath } from "../../lib/storage/paths"
import { detectEnvatoCategory, ensureDir, runAutomationSteps } from "./helpers"
import { prisma } from "../prisma"

export async function downloadEnvatoResource(jobId: string, url: string) {
  const session = await prisma.providerSession.findUnique({
    where: { provider: "ENVATO" },
  })

  if (!session || session.status !== "READY") {
    throw new Error("La sesión de Envato no está lista. Sincroniza primero.")
  }

  const category = detectEnvatoCategory(url)
  const rules = await prisma.automationRule.findMany({
    where: { provider: "ENVATO", isActive: true },
  })
  const rule = pickAutomationRule(rules, url, category)

  if (!rule) {
    throw new Error("No hay reglas de automatización activas para Envato")
  }

  const steps = automationStepsSchema.parse(rule.steps) as AutomationStep[]
  const profilePath = session.profilePath || providerProfilePath("envato")
  const downloadDir = jobDownloadDir(jobId)
  ensureDir(downloadDir)

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
