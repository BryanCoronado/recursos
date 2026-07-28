import { AsyncLocalStorage } from "node:async_hooks"

type JobLogStore = {
  jobId: string
  lines: string[]
}

const storage = new AsyncLocalStorage<JobLogStore>()
const MAX_CHARS = 120_000

export async function withJobLog<T>(
  jobId: string,
  fn: () => Promise<T>
): Promise<{ result?: T; error?: unknown; logs: string }> {
  const store: JobLogStore = { jobId, lines: [] }
  try {
    const result = await storage.run(store, fn)
    return { result, logs: finalizeLogs(store.lines) }
  } catch (error) {
    return { error, logs: finalizeLogs(store.lines) }
  }
}

export function jobLog(...parts: unknown[]) {
  const line = formatLine(parts)
  console.info(line)
  const store = storage.getStore()
  if (store) store.lines.push(line)
}

function formatLine(parts: unknown[]) {
  const stamp = new Date().toISOString()
  const body = parts
    .map((part) => {
      if (typeof part === "string") return part
      if (part instanceof Error) return part.stack || part.message
      try {
        return JSON.stringify(part)
      } catch {
        return String(part)
      }
    })
    .join(" ")
  return `[${stamp}] ${body}`
}

function finalizeLogs(lines: string[]) {
  const text = lines.join("\n")
  if (text.length <= MAX_CHARS) return text
  return `${text.slice(0, MAX_CHARS)}\n…[log truncado]`
}
