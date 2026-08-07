"use server"

import { requirePermission, requireUser } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  claimDevice,
  enforceSessionDevices,
  type ClaimDeviceResult,
  type SessionDeviceEnforcement,
} from "@/lib/billing/devices"
import { requireProviderId } from "@/lib/providers/catalog"

export async function claimDeviceAction(input: {
  provider: string
  deviceId: string
  userAgent?: string
}): Promise<ClaimDeviceResult> {
  const user = await requireUser()
  const provider = requireProviderId(input.provider)
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

export async function enforceSessionDevicesAction(input: {
  deviceId: string
  userAgent?: string
}): Promise<SessionDeviceEnforcement> {
  const user = await requireUser()
  // Admins sin cupo de cliente no se bloquean por esto.
  if (user.isSuperAdmin) {
    return { blocked: false, hasMembership: false }
  }

  return enforceSessionDevices({
    userId: user.id,
    rawDeviceId: input.deviceId,
    userAgent: input.userAgent,
  })
}

export async function revokeOwnDeviceAction(_formData: FormData) {
  // Los clientes no pueden liberar cupos solos (evita saltarse el límite).
  throw new Error(
    "No puedes quitar dispositivos desde tu cuenta. Escribe por WhatsApp para solicitar un cambio."
  )
}
