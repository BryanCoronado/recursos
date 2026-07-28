import "server-only"

import { cookies, headers } from "next/headers"

import {
  clientIpFromHeaders,
} from "@/lib/billing/fingerprint"
import type { FreeDownloadContext } from "@/lib/billing/membership"

export async function freeDownloadContextFromRequest(): Promise<FreeDownloadContext> {
  const [cookieStore, hdrs] = await Promise.all([cookies(), headers()])
  return {
    rawDeviceId: cookieStore.get("mich-device-id")?.value ?? null,
    clientIp: clientIpFromHeaders(hdrs),
  }
}
