import fs from "node:fs"
import path from "node:path"

import type { Download, Locator, Page } from "playwright"

import type { AutomationStep } from "../../lib/automation/types"
import { jobLog } from "./job-log"

function log(...parts: unknown[]) {
  jobLog("[automation]", ...parts)
}

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
    // force
  }

  try {
    await target.click({ force: true, timeout: timeoutMs })
    return
  } catch {
    // último
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
      log(`intento clic ${candidate.by}: ${candidate.selector.slice(0, 120)}`)
      const locator = locatorFor(page, candidate.by, candidate.selector)
      const count = await locator.count()
      log(`  matches=${count}`)
      if (count === 0) continue
      await locator.first().waitFor({ state: "attached", timeout: timeoutMs })
      const visible = await locator.first().isVisible().catch(() => false)
      const enabled = await locator.first().isEnabled().catch(() => false)
      const text = (
        await locator.first().innerText().catch(() => "")
      ).replace(/\s+/g, " ").trim().slice(0, 80)
      log(`  visible=${visible} enabled=${enabled} text="${text}"`)
      await robustClick(locator, timeoutMs)
      log(`  clic OK con ${candidate.by}`)
      return
    } catch (error) {
      lastError = error
      log(`  clic falló: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "Clic fallido"))
}

async function describePageState(page: Page, label: string) {
  try {
    const url = page.url()
    const title = await page.title().catch(() => "")
    const buttons = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll("button, a[role='button'], [role='button']")
      )
      return nodes
        .slice(0, 40)
        .map((el) => {
          const text = (el.textContent || "").replace(/\s+/g, " ").trim()
          if (!text) return null
          const tag = el.tagName.toLowerCase()
          const disabled =
            el instanceof HTMLButtonElement ? el.disabled : false
          return { tag, text: text.slice(0, 60), disabled }
        })
        .filter(Boolean)
    })
    log(`${label} url=${url}`)
    log(`${label} title="${title}"`)
    log(`${label} botones visibles (max 40):`, JSON.stringify(buttons))
  } catch (error) {
    log(
      `${label} no se pudo leer estado:`,
      error instanceof Error ? error.message : String(error)
    )
  }
}

export async function runAutomationSteps(
  page: Page,
  steps: AutomationStep[],
  downloadDir: string
) {
  ensureDir(downloadDir)
  log(`inicio pasos count=${steps.length} downloadDir=${downloadDir}`)
  await describePageState(page, "antes-de-pasos")

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index]
    log(`paso #${index + 1}/${steps.length} type=${step.type}`, JSON.stringify(step))

    if (step.type === "wait") {
      log(`esperando ${step.ms}ms`)
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
        log(`waitFor OK`)
      } catch (error) {
        await describePageState(page, "waitFor-falló")
        throw new Error(
          `No apareció el selector (${step.by}): ${step.selector}. ${String(error)}`
        )
      }
      continue
    }

    if (step.type === "click") {
      try {
        await clickWithFallbacks(page, step, 45_000)
        await page.waitForTimeout(1800)
        await describePageState(page, "después-click")
      } catch (error) {
        if (step.optional) {
          log(`click opcional omitido`)
          continue
        }
        await describePageState(page, "click-falló")
        throw new Error(
          `No se pudo hacer click (${step.by}): ${step.selector}. ${String(error)}`
        )
      }
      continue
    }

    if (step.type === "download") {
      return await runDownloadStep(page, step, downloadDir)
    }
  }

  throw new Error("La automatización terminó sin paso de descarga")
}

async function runDownloadStep(
  page: Page,
  step: Extract<AutomationStep, { type: "download" }>,
  downloadDir: string
) {
  const timeoutMs = step.timeoutMs ?? 120_000
  const context = page.context()
  log(`download: escuchando evento en context timeout=${timeoutMs}ms`)
  await describePageState(page, "antes-download-click")

  let resolved = false
  const downloadWait = new Promise<Download>((resolve, reject) => {
    const startedAt = Date.now()
    const timer = setTimeout(() => {
      if (resolved) return
      resolved = true
      cleanup()
      reject(
        new Error(
          `Timeout ${timeoutMs}ms sin evento download (elapsed=${Date.now() - startedAt}ms)`
        )
      )
    }, timeoutMs)

    const onDownload = (download: Download) => {
      if (resolved) return
      resolved = true
      cleanup()
      log(
        `download EVENTO recibido suggested=${download.suggestedFilename()} url=${download.url()}`
      )
      resolve(download)
    }

    const onPage = (newPage: Page) => {
      log(`nueva pestaña abierta: ${newPage.url()}`)
      newPage.on("download", onDownload)
      void newPage.url()
      void newPage
        .waitForLoadState("domcontentloaded")
        .then(() => describePageState(newPage, "nueva-pestaña"))
        .catch(() => undefined)
    }

    function cleanup() {
      clearTimeout(timer)
      context.off("download", onDownload)
      context.off("page", onPage)
    }

    context.on("download", onDownload)
    context.on("page", onPage)
  })

  const navPromise = page
    .waitForEvent("framenavigated", { timeout: timeoutMs })
    .then((frame) => {
      if (frame === page.mainFrame()) {
        log(`navegación mainFrame → ${page.url()}`)
      }
    })
    .catch(() => undefined)

  try {
    log(`download: haciendo clic en selector`)
    await clickWithFallbacks(page, step, 45_000)
    log(`download: clic disparado; esperando archivo…`)
  } catch (error) {
    await describePageState(page, "download-click-falló")
    throw new Error(
      `No se pudo hacer click de descarga (${step.by}): ${step.selector}. ${String(error)}`
    )
  }

  // Estado 2s y 8s después del clic (sin asumir modal de licencia)
  void (async () => {
    await page.waitForTimeout(2000)
    if (!resolved) await describePageState(page, "t+2s-post-click")
    await page.waitForTimeout(6000)
    if (!resolved) await describePageState(page, "t+8s-post-click")
  })()

  try {
    const download = await downloadWait
    await navPromise
    const suggested =
      download.suggestedFilename() || `download-${Date.now()}.bin`
    const targetPath = path.join(downloadDir, suggested)
    log(`guardando archivo → ${targetPath}`)
    await download.saveAs(targetPath)
    const size = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0
    log(`archivo OK name=${suggested} bytes=${size}`)
    return {
      filePath: targetPath,
      fileName: suggested,
    }
  } catch (error) {
    await describePageState(page, "download-timeout-o-error")
    const files = fs.existsSync(downloadDir)
      ? fs.readdirSync(downloadDir)
      : []
    log(`archivos en downloadDir:`, files)
    throw error
  }
}

export function detectEnvatoCategory(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes("video") || lower.includes("/stock-video")) return "video"
  if (lower.includes("music") || lower.includes("/audio")) return "audio"
  if (lower.includes("graphic") || lower.includes("template")) return "template"
  return "default"
}
