import { type BrowserContext, type Page } from "playwright"
import { z } from "zod"

import {
  automationStepSchema,
  type AutomationStep,
} from "../../lib/automation/types"
import {
  getProvider,
  type ResourceProviderId,
} from "../../lib/providers/catalog"
import { providerProfilePath } from "../../lib/storage/paths"
import { ensureDir } from "./helpers"
import { launchWorkerContext } from "./launch"
import { prisma } from "../prisma"

const RECORDER_INIT = `(() => {
  if (window.__michRecorderInstalled) return;
  window.__michRecorderInstalled = true;

  function cssPath(el) {
    if (!(el instanceof Element)) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 7) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift('#' + CSS.escape(node.id));
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child) => child.tagName === node.tagName
        );
        if (siblings.length > 1) {
          part += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(part);
      node = parent;
      if (!node || node === document.documentElement) break;
    }
    return parts.join(' > ');
  }

  function xpathFor(el) {
    if (!(el instanceof Element)) return '';
    if (el.id) return '//*[@id="' + el.id.replace(/"/g, '\\\\"') + '"]';
    if (el instanceof HTMLLabelElement && el.htmlFor) {
      return '//label[@for="' + el.htmlFor.replace(/"/g, '\\\\"') + '"]';
    }
    const aria = el.getAttribute('aria-label');
    if (aria) {
      return '//' + el.tagName.toLowerCase() + '[@aria-label="' + aria.replace(/"/g, '\\\\"') + '"]';
    }
    const text = (el.innerText || '').trim().replace(/\\\\s+/g, ' ');
    if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && text && text.length < 60) {
      return '//' + el.tagName.toLowerCase() + '[contains(normalize-space(.), "' + text.replace(/"/g, '\\\\"') + '")]';
    }
    let node = el;
    const parts = [];
    while (node && node.nodeType === 1) {
      if (node.id) {
        parts.unshift('//' + '*[@id="' + node.id.replace(/"/g, '\\\\"') + '"]');
        return parts.length === 1
          ? parts[0]
          : parts[0] + '/' + parts.slice(1).join('/');
      }
      let index = 1;
      let sibling = node.previousElementSibling;
      while (sibling) {
        if (sibling.nodeName === node.nodeName) index += 1;
        sibling = sibling.previousElementSibling;
      }
      parts.unshift(node.nodeName.toLowerCase() + '[' + index + ']');
      node = node.parentElement;
      if (parts.length > 8) break;
    }
    return '//' + parts.join('/');
  }

  function preferredSelector(el) {
    if (el.id) return { by: 'css', selector: '#' + CSS.escape(el.id) };
    if (el instanceof HTMLLabelElement && el.htmlFor) {
      return { by: 'css', selector: 'label[for="' + CSS.escape(el.htmlFor) + '"]' };
    }
    const aria = el.getAttribute('aria-label');
    if (aria) {
      return { by: 'css', selector: el.tagName.toLowerCase() + '[aria-label="' + aria.replace(/"/g, '\\\\"') + '"]' };
    }
    return { by: 'xpath', selector: xpathFor(el) };
  }

  document.addEventListener(
    'click',
    (event) => {
      let el = event.target;
      if (!(el instanceof Element)) return;

      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        const byFor = el.id
          ? document.querySelector('label[for="' + CSS.escape(el.id) + '"]')
          : null;
        const wrappingLabel = el.closest('label');
        el = byFor || wrappingLabel || el;
      } else {
        const clickable = el.closest('button, a, [role="button"], label');
        if (clickable instanceof Element) el = clickable;
      }

      const preferred = preferredSelector(el);
      const payload = {
        by: preferred.by,
        css: cssPath(el),
        xpath: preferred.by === 'xpath' ? preferred.selector : xpathFor(el),
        selector: preferred.selector,
        text: (el.innerText || el.textContent || '').trim().slice(0, 100),
      };
      if (typeof window.__michRecordClick === 'function') {
        window.__michRecordClick(payload);
      }
    },
    true
  );
})();`

const recordContexts = new Map<ResourceProviderId, BrowserContext>()
const closingIntentionally = new Set<ResourceProviderId>()

export function isRecorderBrowserOpen(provider?: ResourceProviderId) {
  if (provider) return recordContexts.has(provider)
  return recordContexts.size > 0
}

export function listOpenRecorderProviders(): ResourceProviderId[] {
  return [...recordContexts.keys()]
}

type ClickPayload = {
  by?: "css" | "xpath"
  css?: string
  xpath?: string
  selector?: string
  text?: string
}

async function appendRecordedStep(
  provider: ResourceProviderId,
  step: AutomationStep
) {
  const recording = await prisma.automationRecording.findUnique({
    where: { provider },
  })
  if (!recording || recording.status !== "RECORDING") return

  const currentRaw = Array.isArray(recording.steps) ? recording.steps : []
  const currentParsed = z.array(automationStepSchema).safeParse(currentRaw)
  const steps = currentParsed.success ? [...currentParsed.data] : []
  if (steps.length > 0 && step.type !== "wait") {
    steps.push({ type: "wait", ms: 1500 })
  }
  steps.push(step)

  await prisma.automationRecording.update({
    where: { provider },
    data: {
      steps,
      nextClickIsDownload: false,
      lastError: null,
    },
  })

  console.info(
    `[worker] Paso grabado ${provider} (#${steps.length}): ${step.type}`
  )
}

async function attachRecorder(page: Page, provider: ResourceProviderId) {
  try {
    await page.exposeBinding("__michRecordClick", async (_source, raw) => {
      const payload = raw as ClickPayload
      const by = payload.by ?? (payload.xpath ? "xpath" : "css")
      const selector =
        payload.selector ||
        (by === "xpath" ? payload.xpath : payload.css) ||
        ""
      if (!selector) return

      const recording = await prisma.automationRecording.findUnique({
        where: { provider },
      })
      if (!recording || recording.status !== "RECORDING") return

      if (recording.nextClickIsDownload) {
        await appendRecordedStep(provider, {
          type: "download",
          by,
          selector,
          timeoutMs: 120_000,
        })
        return
      }

      await appendRecordedStep(provider, {
        type: "click",
        by,
        selector,
      })
    })
  } catch {
    // Binding may already exist on reused page
  }

  await page.addInitScript(RECORDER_INIT)
  await page.evaluate(RECORDER_INIT)
}

export async function openAutomationRecorder(provider: ResourceProviderId) {
  const def = getProvider(provider)
  const recording = await prisma.automationRecording.findUnique({
    where: { provider },
  })

  if (!recording?.sampleUrl || recording.status !== "RECORDING") {
    return
  }

  const session = await prisma.providerSession.findUnique({
    where: { provider },
  })
  if (!session || session.status !== "READY") {
    await prisma.automationRecording.update({
      where: { provider },
      data: {
        status: "IDLE",
        lastError: `La sesión ${def.shortLabel} debe estar en Listo antes de grabar. Sincroniza primero.`,
      },
    })
    return
  }

  const profilePath = session.profilePath || providerProfilePath(def.slug)
  ensureDir(profilePath)

  const existing = recordContexts.get(provider)
  if (existing) {
    closingIntentionally.add(provider)
    try {
      await existing.close()
    } catch {
      // ignore
    }
    recordContexts.delete(provider)
    closingIntentionally.delete(provider)
  }

  const context = await launchWorkerContext(profilePath)

  recordContexts.set(provider, context)
  await context.addInitScript(RECORDER_INIT)

  const page = context.pages()[0] ?? (await context.newPage())
  await attachRecorder(page, provider)

  page.on("framenavigated", async (frame) => {
    if (frame === page.mainFrame()) {
      try {
        await page.evaluate(RECORDER_INIT)
      } catch {
        // ignore
      }
    }
  })

  context.on("page", async (newPage) => {
    try {
      await attachRecorder(newPage, provider)
    } catch {
      // ignore
    }
  })

  context.on("close", () => {
    recordContexts.delete(provider)
    if (!closingIntentionally.has(provider)) {
      void prisma.automationRecording
        .updateMany({
          where: { provider, status: "RECORDING" },
          data: {
            status: "STOPPED",
            lastError:
              "Navegador cerrado. Revisa los pasos y pulsa Guardar regla, o vuelve a grabar.",
          },
        })
        .catch(() => undefined)
    }
  })

  await page.goto(recording.sampleUrl, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  })
  await page.evaluate(RECORDER_INIT)

  console.info(`[worker] Grabadora ${def.shortLabel}:`, recording.sampleUrl)
}

export async function closeAutomationRecorder(provider: ResourceProviderId) {
  const context = recordContexts.get(provider)
  if (!context) return
  closingIntentionally.add(provider)
  try {
    await context.close()
  } catch {
    // ignore
  }
  recordContexts.delete(provider)
  closingIntentionally.delete(provider)
}

/** Compat Envato */
export async function openEnvatoAutomationRecorder() {
  return openAutomationRecorder("ENVATO")
}

export function isRecordingActive() {
  return recordContexts.size > 0
}
