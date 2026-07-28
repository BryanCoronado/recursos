import "server-only"

import { createHash } from "crypto"

export function hashDeviceFingerprint(raw: string) {
  return createHash("sha256").update(raw.trim()).digest("hex").slice(0, 64)
}

export function clientIpFromHeaders(headersList: {
  get(name: string): string | null
}) {
  const forwarded = headersList.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first.slice(0, 64)
  }
  const realIp = headersList.get("x-real-ip")?.trim()
  if (realIp) return realIp.slice(0, 64)
  return null
}
