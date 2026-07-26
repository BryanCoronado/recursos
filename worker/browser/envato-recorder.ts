import { chromium, type BrowserContext, type Page } from "playwright"

import {
  automationStepSchema,
  type AutomationStep,
} from "../../lib/automation/types"
import { providerProfilePath } from "../../lib/storage/paths"
import { ensureDir } from "./helpers"
import { prisma } from "../prisma"
import { z } from "zod"

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
    if (el.id) return '//*[@id="' + el.id.replace(/"/g, '\\"') + '"]';
    if (el instanceof HTMLLabelElement && el.htmlFor) {
      return '//label[@for="' + el.htmlFor.replace(/"/g, '\\"') + '"]';
    }
    const aria = el.getAttribute('aria-label');
    if (aria) {
      return '//' + el.tagName.toLowerCase() + '[@aria-label="' + aria.replace(/"/g, '\\"') + '"]';
    }
    const text = (el.innerText || '').trim().replace(/\\s+/g, ' ');
    if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && text && text.length < 60) {
      return '//' + el.tagName.toLowerCase() + '[contains(normalize-space(.), "' + text.replace(/"/g, '\\"') + '")]';
    }
    // Evitar XPath absoluto frágil: subir hasta un ancestro con id
    let node = el;
    const parts = [];
    while (node && node.nodeType === 1) {
      if (node.id) {
        parts.unshift('//' + '*[@id="' + node.id.replace(/"/g, '\\"') + '"]');
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
      return { by: 'css', selector: el.tagName.toLowerCase() + '[aria-label="' + aria.replace(/"/g, '\\"') + '"]' };
    }
    return { by: 'xpath', selector: xpathFor(el) };
  }

  document.addEventListener(
    'click',
    (event) => {
      let el = event.target;
      if (!(el instanceof Element)) return;

      // Preferir label/botón visible en vez del input oculto.
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

let recordContext: BrowserContext | null = null
let recordingActive = false
let closingIntentionally = false

export function isRecorderBrowserOpen() {
  return recordContext !== null
}

type ClickPayload = {
  by?: "css" | "xpath"
  css?: string
  xpath?: string
  selector?: string
  text?: string
}

async function appendRecordedStep(step: AutomationStep) {
  const recording = await prisma.automationRecording.findUnique({
    where: { provider: "ENVATO" },
  })
  if (!recording || recording.status !== "RECORDING") return

  const currentRaw = Array.isArray(recording.steps) ? recording.steps : []
  const currentParsed = z.array(automationStepSchema).safeParse(currentRaw)
  const steps = currentParsed.success ? [...currentParsed.data] : []
  // Pausa automática antes de cada clic (modales)
  if (steps.length > 0 && step.type !== "wait") {
    steps.push({ type: "wait", ms: 1500 })
  }
  steps.push(step)

  await prisma.automationRecording.update({
    where: { provider: "ENVATO" },
    data: {
      steps,
      nextClickIsDownload: false,
      lastError: null,
    },
  })

  console.info(
    `[worker] Paso grabado (#${steps.length}): ${step.type} ${"selector" in step ? step.selector.slice(0, 80) : ""}`
  )
}

async function attachRecorder(page: Page) {
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
        where: { provider: "ENVATO" },
      })
      if (!recording || recording.status !== "RECORDING") return

      if (recording.nextClickIsDownload) {
        await appendRecordedStep({
          type: "download",
          by,
          selector,
          timeoutMs: 120_000,
        })
        return
      }

      await appendRecordedStep({
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

export async function openAutomationRecorder() {
  const recording = await prisma.automationRecording.findUnique({
    where: { provider: "ENVATO" },
  })

  if (!recording?.sampleUrl || recording.status !== "RECORDING") {
    return
  }

  const session = await prisma.providerSession.findUnique({
    where: { provider: "ENVATO" },
  })
  if (!session || session.status !== "READY") {
    await prisma.automationRecording.update({
      where: { provider: "ENVATO" },
      data: {
        status: "IDLE",
        lastError:
          "La sesión Envato debe estar en Listo antes de grabar. Sincroniza primero.",
      },
    })
    return
  }

  const profilePath = session.profilePath || providerProfilePath("envato")
  ensureDir(profilePath)

  if (recordContext) {
    closingIntentionally = true
    try {
      await recordContext.close()
    } catch {
      // ignore
    }
    recordContext = null
    closingIntentionally = false
  }

  recordContext = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    viewport: { width: 1360, height: 900 },
    acceptDownloads: true,
    args: ["--disable-blink-features=AutomationControlled"],
  })

  recordingActive = true
  await recordContext.addInitScript(RECORDER_INIT)

  const page = recordContext.pages()[0] ?? (await recordContext.newPage())
  await attachRecorder(page)

  page.on("framenavigated", async (frame) => {
    if (frame === page.mainFrame()) {
      try {
        await page.evaluate(RECORDER_INIT)
      } catch {
        // ignore
      }
    }
  })

  recordContext.on("page", async (newPage) => {
    try {
      await attachRecorder(newPage)
    } catch {
      // ignore
    }
  })

  recordContext.on("close", () => {
    recordContext = null
    recordingActive = false
    if (!closingIntentionally) {
      void prisma.automationRecording
        .updateMany({
          where: { provider: "ENVATO", status: "RECORDING" },
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

  console.info("[worker] Grabadora abierta:", recording.sampleUrl)
}

export async function closeAutomationRecorder() {
  if (!recordContext) {
    recordingActive = false
    return
  }
  closingIntentionally = true
  try {
    await recordContext.close()
  } catch {
    // ignore
  }
  recordContext = null
  recordingActive = false
  closingIntentionally = false
}

export function isRecordingActive() {
  return recordingActive
}
