const STORAGE_KEY = "mich-device-id"

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = window.localStorage.getItem(STORAGE_KEY)
    if (!id || id.length < 16) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `mich-${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return `mich-fallback-${Date.now()}`
  }
}
