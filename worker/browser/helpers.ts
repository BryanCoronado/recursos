import fs from "node:fs"
import path from "node:path"

import type { Locator, Page } from "playwright"

import type { AutomationStep } from "../../lib/automation/types"

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

/** Escape para selectores CSS en Node (CSS.escape no existe fuera del browser). */
function cssEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

export function locatorFor(page: Page, by: "css" | "xpath", selector: string) {
  return by === "xpath" ? page.locator(`xpath=${selector}`) : page.locator(selector)
}

type SelectorCandidate = { by: "css" | "xpath"; selector: string }

function extractIdFromSelector(selector: string) {
  const fromAttr = selector.match(/@id=["']([^"']+)["']/)
  if (fromAttr?.[1]) return fromAttr[1]
  const fromCss = selector.match(/^#([A-Za-z_][\w:-]*)$/)
  if (fromCss?.[1]) return fromCss[1]
  const fromFor = selector.match(/\[for=["']([^"']+)["']\]/)
  if (fromFor?.[1]) return fromFor[1]
  return null
}

function isBrittleAbsoluteXPath(selector: string) {
  return /^\/html\[\d+\]\/body\[\d+\]/i.test(selector)
}

/** Alternativas más estables cuando el XPath absoluto del modal falla. */
function buildClickCandidates(step: {
  by: "css" | "xpath"
  selector: string
}): SelectorCandidate[] {
  const candidates: SelectorCandidate[] = [
    { by: step.by, selector: step.selector },
  ]

  const id = extractIdFromSelector(step.selector)
  if (id) {
    candidates.push({ by: "css", selector: `#${cssEscape(id)}` })
    candidates.push({
      by: "css",
      selector: `label[for="${cssEscape(id)}"]`,
    })
    candidates.push({
      by: "xpath",
      selector: `//*[@id="${id}"]`,
    })
    candidates.push({
      by: "xpath",
      selector: `//label[@for="${id}"]`,
    })
  }

  // Modal de términos Envato free download
  if (
    isBrittleAbsoluteXPath(step.selector) ||
    /label|checkbox|terms|download/i.test(step.selector)
  ) {
    candidates.push({
      by: "css",
      selector: "#free-download-terms-checkbox",
    })
    candidates.push({
      by: "css",
      selector: 'label[for="free-download-terms-checkbox"]',
    })
    candidates.push({
      by: "xpath",
      selector: '//*[@id="free-download-terms-checkbox"]',
    })
    candidates.push({
      by: "xpath",
      selector: '//label[@for="free-download-terms-checkbox"]',
    })
  }

  const seen = new Set<string>()
  return candidates.filter((item) => {
    const key = `${item.by}:${item.selector}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function robustClick(locator: Locator, timeoutMs = 45_000) {
  const target = locator.first()
  await target.waitFor({ state: "attached", timeout: timeoutMs })

  try {
    await target.scrollIntoViewIfNeeded({ timeout: 5_000 })
  } catch {
    // ignore
  }

  const tagName = await target.evaluate((el) => el.tagName.toLowerCase())
  const inputType = await target.evaluate((el) =>
    el instanceof HTMLInputElement ? el.type : ""
  )
  const htmlFor = await target.getAttribute("for")

  // label[for=checkbox] → marcar el input asociado
  if (tagName === "label" && htmlFor) {
    const input = target.page().locator(`#${cssEscape(htmlFor)}`).first()
    if ((await input.count()) > 0) {
      try {
        await input.check({ force: true, timeout: timeoutMs })
        return
      } catch {
        try {
          await target.click({ force: true, timeout: 5_000 })
          return
        } catch {
          await input.evaluate((el) => {
            if (el instanceof HTMLInputElement) {
              el.checked = true
              el.dispatchEvent(new Event("input", { bubbles: true }))
              el.dispatchEvent(new Event("change", { bubbles: true }))
            }
          })
          return
        }
      }
    }
  }

  if (tagName === "input" && (inputType === "checkbox" || inputType === "radio")) {
    const id = await target.getAttribute("id")
    if (id) {
      const label = target.page().locator(`label[for="${cssEscape(id)}"]`).first()
      if ((await label.count()) > 0) {
        try {
          await label.click({ force: true, timeout: 5_000 })
          return
        } catch {
          // sigue
        }
      }
    }

    try {
      if (inputType === "checkbox") {
        await target.check({ force: true, timeout: timeoutMs })
      } else {
        await target.click({ force: true, timeout: timeoutMs })
      }
      return
    } catch {
      await target.evaluate((el) => {
        if (el instanceof HTMLInputElement) {
          el.checked = true
          el.dispatchEvent(new Event("input", { bubbles: true }))
          el.dispatchEvent(new Event("change", { bubbles: true }))
          el.click()
        }
      })
      return
    }
  }

  try {
    await target.click({ timeout: Math.min(timeoutMs, 10_000) })
    return
  } catch {
    // force / ancestro
  }

  try {
    await target.click({ force: true, timeout: timeoutMs })
    return
  } catch {
    // último recurso
  }

  const clicked = await target.evaluate((el) => {
    const clickable = el.closest("button, a, [role='button'], label")
    if (clickable instanceof HTMLElement) {
      clickable.click()
      return true
    }
    if (el instanceof HTMLElement) {
      el.click()
      return true
    }
    return false
  })

  if (!clicked) {
    throw new Error("No se pudo disparar el clic en el elemento ni en su ancestro")
  }
}

async function clickWithFallbacks(
  page: Page,
  step: { by: "css" | "xpath"; selector: string },
  timeoutMs = 45_000
) {
  const candidates = buildClickCandidates(step)
  let lastError: unknown

  for (const candidate of candidates) {
    try {
      const locator = locatorFor(page, candidate.by, candidate.selector)
      // Esperar a que exista (modales tardan en abrir)
      await locator.first().waitFor({ state: "attached", timeout: timeoutMs })
      await robustClick(locator, timeoutMs)
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "Clic fallido"))
}

export async function runAutomationSteps(
  page: Page,
  steps: AutomationStep[],
  downloadDir: string
) {
  ensureDir(downloadDir)

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index]

    if (step.type === "wait") {
      await page.waitForTimeout(step.ms)
      continue
    }

    if (step.type === "waitFor") {
      const locator = locatorFor(page, step.by, step.selector)
      try {
        await locator.first().waitFor({
          state: "attached",
          timeout: step.timeoutMs ?? 45_000,
        })
      } catch (error) {
        throw new Error(
          `No apareció el selector (${step.by}): ${step.selector}. ${String(error)}`
        )
      }
      continue
    }

    if (step.type === "click") {
      try {
        await clickWithFallbacks(page, step, 45_000)
        // Dar tiempo a modales / animaciones antes del siguiente paso
        await page.waitForTimeout(1800)
      } catch (error) {
        if (step.optional) continue
        throw new Error(
          `No se pudo hacer click (${step.by}): ${step.selector}. ${String(error)}`
        )
      }
      continue
    }

    if (step.type === "download") {
      const downloadPromise = page.waitForEvent("download", {
        timeout: step.timeoutMs ?? 120_000,
      })
      try {
        await clickWithFallbacks(page, step, 45_000)
      } catch (error) {
        throw new Error(
          `No se pudo hacer click de descarga (${step.by}): ${step.selector}. ${String(error)}`
        )
      }
      const download = await downloadPromise
      const suggested = download.suggestedFilename() || `envato-${Date.now()}.bin`
      const targetPath = path.join(downloadDir, suggested)
      await download.saveAs(targetPath)
      return {
        filePath: targetPath,
        fileName: suggested,
      }
    }
  }

  throw new Error("La automatización terminó sin paso de descarga")
}

export function detectEnvatoCategory(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes("video") || lower.includes("/stock-video")) return "video"
  if (lower.includes("music") || lower.includes("/audio")) return "audio"
  if (lower.includes("graphic") || lower.includes("template")) return "template"
  return "default"
}
