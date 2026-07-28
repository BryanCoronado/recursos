const STORAGE_KEY = "mich-device-id"
const COOKIE_KEY = "mich-device-id"

function readCookie(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return
  const maxAge = 60 * 60 * 24 * 400
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function newDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `mich-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

/** Id estable del navegador (localStorage + cookie). */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = window.localStorage.getItem(STORAGE_KEY) || readCookie(COOKIE_KEY)
    if (!id || id.length < 16) {
      id = newDeviceId()
    }
    window.localStorage.setItem(STORAGE_KEY, id)
    writeCookie(COOKIE_KEY, id)
    return id
  } catch {
    const fallback = newDeviceId()
    try {
      writeCookie(COOKIE_KEY, fallback)
    } catch {
      /* ignore */
    }
    return fallback
  }
}
