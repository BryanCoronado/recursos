import fs from "node:fs"
import path from "node:path"

import type { BrowserContext } from "playwright"

import { ensureDir } from "./helpers"

const SESSION_FILE = "playwright-session.json"

export function sessionStatePath(profilePath: string) {
  return path.join(profilePath, SESSION_FILE)
}

/**
 * Fuerza volcado de cookies/localStorage al disco antes de cerrar Chromium.
 * Sin esto, en Xvfb a veces se pierde el login de Envato al marcar listo.
 */
export async function persistContextSession(
  context: BrowserContext,
  profilePath: string
) {
  ensureDir(profilePath)
  await context.storageState({ path: sessionStatePath(profilePath) })
  // Chromium escribe la DB de cookies de forma asíncrona
  await new Promise((r) => setTimeout(r, 1500))
}

/** Reinyecta cookies guardadas si el perfil persistente no las cargó bien. */
export async function restoreContextSession(
  context: BrowserContext,
  profilePath: string
) {
  const file = sessionStatePath(profilePath)
  if (!fs.existsSync(file)) return

  try {
    const raw = fs.readFileSync(file, "utf8")
    const state = JSON.parse(raw) as {
      cookies?: Parameters<BrowserContext["addCookies"]>[0]
    }
    if (state.cookies?.length) {
      await context.addCookies(state.cookies)
    }
  } catch {
    // archivo corrupto: se regenerará en el próximo persist
  }
}
