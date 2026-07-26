import path from "node:path"

export const STORAGE_ROOT = path.join(process.cwd(), "storage")
export const BROWSER_PROFILES_ROOT = path.join(STORAGE_ROOT, "browser")
export const DOWNLOADS_ROOT = path.join(STORAGE_ROOT, "downloads")

export function providerProfilePath(provider: "envato" | "magnific") {
  return path.join(BROWSER_PROFILES_ROOT, provider)
}

export function jobDownloadDir(jobId: string) {
  return path.join(DOWNLOADS_ROOT, jobId)
}
