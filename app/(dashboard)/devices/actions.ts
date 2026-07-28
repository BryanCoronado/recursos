"use server"

import { revalidatePath } from "next/cache"

import { requirePermission, requireUser } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  claimDevice,
  revokeDevice,
  type ClaimDeviceResult,
} from "@/lib/billing/devices"
import { requireProviderId } from "@/lib/providers/catalog"

export async function claimDeviceAction(input: {
  provider: string
  deviceId: string
  userAgent?: string
}): Promise<ClaimDeviceResult> {
  const user = await requireUser()
  const provider = requireProviderId(input.provider)
  // Acceso al proveedor correspondiente
  if (provider === "ENVATO") {
    await requirePermission(PERMISSIONS.ENVATO_ACCESS)
  } else {
    await requirePermission(PERMISSIONS.MAGNIFIC_ACCESS)
  }

  return claimDevice({
    userId: user.id,
    provider,
    rawDeviceId: input.deviceId,
    userAgent: input.userAgent,
  })
}

export async function revokeOwnDeviceAction(formData: FormData) {
  const user = await requireUser()
  const deviceId = String(formData.get("deviceId") ?? "")
  await revokeDevice({ deviceId, ownerUserId: user.id })
  revalidatePath("/devices")
  revalidatePath("/envato")
  revalidatePath("/magnific")
  revalidatePath("/subscriptions")
}
