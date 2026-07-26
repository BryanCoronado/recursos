import type { AutomationStep } from "./types"

export function extractUrlPattern(url: string): string {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, "") || "/"
    return pathname
  } catch {
    return "/"
  }
}

export function urlMatchesPattern(url: string, pattern: string | null | undefined) {
  if (!pattern?.trim()) return false
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const needle = pattern.trim().toLowerCase()
    return pathname.includes(needle)
  } catch {
    return false
  }
}

export function pickAutomationRule<
  T extends {
    urlPattern: string | null
    category: string
    priority: number
  },
>(rules: T[], url: string, detectedCategory: string): T | null {
  const byPattern = rules
    .filter((rule) => urlMatchesPattern(url, rule.urlPattern))
    .sort((a, b) => {
      const len =
        (b.urlPattern?.length ?? 0) - (a.urlPattern?.length ?? 0)
      if (len !== 0) return len
      return a.priority - b.priority
    })

  if (byPattern[0]) return byPattern[0]

  const byCategory = rules
    .filter((rule) => rule.category === detectedCategory)
    .sort((a, b) => a.priority - b.priority)

  if (byCategory[0]) return byCategory[0]

  const byDefault = rules
    .filter((rule) => rule.category === "default")
    .sort((a, b) => a.priority - b.priority)

  return byDefault[0] ?? null
}

export function ensureDownloadStep(steps: AutomationStep[]): AutomationStep[] {
  if (steps.some((step) => step.type === "download")) return steps
  if (steps.length === 0) return steps

  const last = steps[steps.length - 1]
  if (last.type === "click") {
    return [
      ...steps.slice(0, -1),
      {
        type: "download",
        by: last.by,
        selector: last.selector,
        timeoutMs: 120_000,
      },
    ]
  }

  return steps
}
