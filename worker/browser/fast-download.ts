import { spawn, spawnSync } from "node:child_process"
import { createWriteStream } from "node:fs"
import fs from "node:fs"
import path from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { Download, Page } from "playwright"

import { jobLog } from "./job-log"

function log(...parts: unknown[]) {
  jobLog("[fast-download]", ...parts)
}

const CONNECTIONS = Math.min(
  16,
  Math.max(1, Number(process.env.WORKER_DOWNLOAD_CONNECTIONS ?? 16))
)

let aria2Available: boolean | null = null

function hasAria2() {
  if (aria2Available === null) {
    const probe = spawnSync("aria2c", ["--version"], { stdio: "ignore" })
    aria2Available = probe.status === 0
    if (!aria2Available) {
      log("aria2c no instalado: se usa descarga directa (1 conexión)")
    }
  }
  return aria2Available
}

export function fastDownloadEnabled() {
  return process.env.WORKER_FAST_DOWNLOAD !== "0"
}

async function requestHeaders(page: Page, url: string) {
  const cookies = await page.context().cookies(url)
  const userAgent = await page
    .evaluate(() => navigator.userAgent)
    .catch(() => "")
  return {
    cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
    userAgent,
    referer: page.url(),
  }
}

function runAria2(
  url: string,
  targetPath: string,
  headers: { cookie: string; userAgent: string; referer: string }
) {
  const args = [
    `--dir=${path.dirname(targetPath)}`,
    `--out=${path.basename(targetPath)}`,
    `--max-connection-per-server=${CONNECTIONS}`,
    `--split=${CONNECTIONS}`,
    "--min-split-size=1M",
    "--file-allocation=none",
    "--allow-overwrite=true",
    "--auto-file-renaming=false",
    "--max-tries=5",
    "--retry-wait=2",
    "--summary-interval=15",
    "--console-log-level=warn",
    "--check-certificate=true",
  ]
  if (headers.userAgent) args.push(`--user-agent=${headers.userAgent}`)
  if (headers.referer) args.push(`--referer=${headers.referer}`)
  if (headers.cookie) args.push(`--header=Cookie: ${headers.cookie}`)
  args.push(url)

  return new Promise<void>((resolve, reject) => {
    const child = spawn("aria2c", args, { stdio: ["ignore", "pipe", "pipe"] })
    child.stdout.on("data", (chunk: Buffer) => {
      const line = chunk.toString().trim()
      if (line) log(`aria2c: ${line.slice(0, 300)}`)
    })
    child.stderr.on("data", (chunk: Buffer) => {
      const line = chunk.toString().trim()
      if (line) log(`aria2c err: ${line.slice(0, 300)}`)
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`aria2c salió con código ${code}`))
    })
  })
}

async function runFetch(
  url: string,
  targetPath: string,
  headers: { cookie: string; userAgent: string; referer: string }
) {
  const res = await fetch(url, {
    headers: {
      ...(headers.cookie ? { cookie: headers.cookie } : {}),
      ...(headers.userAgent ? { "user-agent": headers.userAgent } : {}),
      ...(headers.referer ? { referer: headers.referer } : {}),
    },
    redirect: "follow",
  })
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} al bajar directo`)
  }
  await pipeline(
    Readable.fromWeb(res.body as import("node:stream/web").ReadableStream),
    createWriteStream(targetPath)
  )
}

/**
 * Toma el enlace real que generó Envato y lo baja fuera de Chromium:
 * aria2c con varias conexiones en paralelo (mucho más rápido en archivos
 * grandes) o, si no está instalado, fetch directo sin la copia final de saveAs.
 * Devuelve false si no se pudo y hay que usar download.saveAs().
 */
export async function tryFastDownload(
  page: Page,
  download: Download,
  targetPath: string
) {
  const url = download.url()
  if (!fastDownloadEnabled() || !/^https?:\/\//i.test(url)) return false

  const headers = await requestHeaders(page, url)
  const started = Date.now()

  // Algunos enlaces firmados son de un solo uso: si no aceptan una segunda
  // petición, dejamos que Chromium siga con la suya.
  const probe = await fetch(url, {
    headers: {
      range: "bytes=0-0",
      ...(headers.cookie ? { cookie: headers.cookie } : {}),
      ...(headers.userAgent ? { "user-agent": headers.userAgent } : {}),
      ...(headers.referer ? { referer: headers.referer } : {}),
    },
    redirect: "follow",
  }).catch(() => null)
  await probe?.body?.cancel().catch(() => undefined)
  if (!probe || (probe.status !== 206 && probe.status !== 200)) {
    log(`enlace no reutilizable (status=${probe?.status ?? "error"}); sigue Chromium`)
    return false
  }
  log(`enlace OK status=${probe.status} rangos=${probe.status === 206}`)

  // Cortamos la descarga de Chromium para no bajar el archivo dos veces.
  await download.cancel().catch(() => undefined)

  try {
    if (hasAria2()) {
      log(`aria2c x${CONNECTIONS} → ${targetPath}`)
      await runAria2(url, targetPath, headers)
    } else {
      log(`fetch directo → ${targetPath}`)
      await runFetch(url, targetPath, headers)
    }
  } catch (error) {
    log(
      `falló descarga rápida: ${error instanceof Error ? error.message : String(error)}; reintento con fetch`
    )
    fs.rmSync(targetPath, { force: true })
    await runFetch(url, targetPath, headers)
  }

  const size = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0
  const secs = Math.max(0.001, (Date.now() - started) / 1000)
  log(
    `OK bytes=${size} en ${secs.toFixed(1)}s (${(size / 1024 / 1024 / secs).toFixed(1)} MB/s)`
  )
  return true
}
