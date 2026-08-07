import "server-only"

import { getActiveMembership } from "@/lib/billing/membership"
import { hashDeviceFingerprint } from "@/lib/billing/fingerprint"
import { getProvider, type ResourceProviderId } from "@/lib/providers/catalog"
import { providerList } from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

function hashDeviceId(rawDeviceId: string) {
  return hashDeviceFingerprint(rawDeviceId)
}

export function labelFromUserAgent(ua: string | null | undefined) {
  if (!ua) return "Dispositivo"
  const browser =
    /Edg\//.test(ua)
      ? "Edge"
      : /Chrome\//.test(ua) && !/Chromium/.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navegador"
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X|Macintosh/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Otro"
  return `${browser} · ${os}`
}

export type ClaimDeviceResult =
  | {
      ok: true
      skipped: true
      reason: "no_membership"
    }
  | {
      ok: true
      skipped: false
      deviceId: string
      maxDevices: number
      used: number
    }
  | {
      ok: false
      reason: "limit_reached" | "invalid_device"
      message: string
      maxDevices: number
      used: number
      provider?: ResourceProviderId
    }

/** Cupos ocupados del usuario en ese proveedor (todas las membresías). */
export async function countDevicesForProvider(
  userId: string,
  provider: ResourceProviderId
) {
  return prisma.membershipDevice.count({
    where: { userId, provider },
  })
}

export async function claimDevice(input: {
  userId: string
  provider: ResourceProviderId
  rawDeviceId: string
  userAgent?: string | null
}): Promise<ClaimDeviceResult> {
  const raw = input.rawDeviceId?.trim()
  if (!raw || raw.length < 8 || raw.length > 128) {
    return {
      ok: false,
      reason: "invalid_device",
      message: "Identificador de dispositivo inválido.",
      maxDevices: 1,
      used: 0,
      provider: input.provider,
    }
  }

  const membership = await getActiveMembership(input.userId, input.provider)
  if (!membership) {
    return { ok: true, skipped: true, reason: "no_membership" }
  }

  const deviceKey = hashDeviceId(raw)
  const label = labelFromUserAgent(input.userAgent)
  const now = new Date()

  const existing = await prisma.membershipDevice.findUnique({
    where: {
      userId_provider_deviceKey: {
        userId: input.userId,
        provider: input.provider,
        deviceKey,
      },
    },
  })

  if (existing) {
    await prisma.membershipDevice.update({
      where: { id: existing.id },
      data: {
        membershipId: membership.id,
        lastSeenAt: now,
        label,
        userAgent: input.userAgent || existing.userAgent,
      },
    })
    const used = await countDevicesForProvider(input.userId, input.provider)
    return {
      ok: true,
      skipped: false,
      deviceId: existing.id,
      maxDevices: membership.maxDevices,
      used,
    }
  }

  const used = await countDevicesForProvider(input.userId, input.provider)

  if (used >= membership.maxDevices) {
    const def = getProvider(input.provider)
    return {
      ok: false,
      reason: "limit_reached",
      message: `Tu plan de ${def.shortLabel} permite ${membership.maxDevices} dispositivo(s). Este equipo no está autorizado. Escribe por WhatsApp para liberar un cupo o ampliar el plan.`,
      maxDevices: membership.maxDevices,
      used,
      provider: input.provider,
    }
  }

  try {
    const created = await prisma.membershipDevice.create({
      data: {
        membershipId: membership.id,
        userId: input.userId,
        provider: input.provider,
        deviceKey,
        label,
        userAgent: input.userAgent || null,
        lastSeenAt: now,
      },
    })

    return {
      ok: true,
      skipped: false,
      deviceId: created.id,
      maxDevices: membership.maxDevices,
      used: used + 1,
    }
  } catch {
    // Carrera: otro request ocupó el cupo o el mismo key.
    const again = await prisma.membershipDevice.findUnique({
      where: {
        userId_provider_deviceKey: {
          userId: input.userId,
          provider: input.provider,
          deviceKey,
        },
      },
    })
    if (again) {
      await prisma.membershipDevice.update({
        where: { id: again.id },
        data: {
          membershipId: membership.id,
          lastSeenAt: now,
          label,
        },
      })
      return {
        ok: true,
        skipped: false,
        deviceId: again.id,
        maxDevices: membership.maxDevices,
        used: await countDevicesForProvider(input.userId, input.provider),
      }
    }
    const usedNow = await countDevicesForProvider(input.userId, input.provider)
    const def = getProvider(input.provider)
    return {
      ok: false,
      reason: "limit_reached",
      message: `Tu plan de ${def.shortLabel} permite ${membership.maxDevices} dispositivo(s). Este equipo no está autorizado. Escribe por WhatsApp para liberar un cupo o ampliar el plan.`,
      maxDevices: membership.maxDevices,
      used: usedNow,
      provider: input.provider,
    }
  }
}

export type SessionDeviceEnforcement =
  | { blocked: false; hasMembership: boolean }
  | {
      blocked: true
      message: string
      maxDevices: number
      used: number
      provider: ResourceProviderId
    }

/**
 * Reclama cupo en todos los proveedores con membresía activa.
 * Si este dispositivo no cabe en alguno → bloqueado.
 */
export async function enforceSessionDevices(input: {
  userId: string
  rawDeviceId: string
  userAgent?: string | null
}): Promise<SessionDeviceEnforcement> {
  let hasMembership = false

  for (const provider of providerList()) {
    const membership = await getActiveMembership(input.userId, provider.id)
    if (!membership) continue
    hasMembership = true

    const result = await claimDevice({
      userId: input.userId,
      provider: provider.id,
      rawDeviceId: input.rawDeviceId,
      userAgent: input.userAgent,
    })

    if (!result.ok) {
      return {
        blocked: true,
        message: result.message,
        maxDevices: result.maxDevices,
        used: result.used,
        provider: provider.id,
      }
    }
  }

  return { blocked: false, hasMembership }
}

export async function assertDeviceAllowed(input: {
  userId: string
  provider: ResourceProviderId
  rawDeviceId: string
}): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const membership = await getActiveMembership(input.userId, input.provider)
  if (!membership) {
    return { allowed: true }
  }

  const raw = input.rawDeviceId?.trim()
  if (!raw) {
    return {
      allowed: false,
      reason:
        "No se pudo identificar este dispositivo. Recarga la página e inténtalo de nuevo.",
    }
  }

  const deviceKey = hashDeviceId(raw)
  const existing = await prisma.membershipDevice.findUnique({
    where: {
      userId_provider_deviceKey: {
        userId: input.userId,
        provider: input.provider,
        deviceKey,
      },
    },
  })

  if (existing) {
    await prisma.membershipDevice.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date(), membershipId: membership.id },
    })
    return { allowed: true }
  }

  const used = await countDevicesForProvider(input.userId, input.provider)
  if (used < membership.maxDevices) {
    const claim = await claimDevice({
      userId: input.userId,
      provider: input.provider,
      rawDeviceId: raw,
    })
    if (claim.ok) return { allowed: true }
    return { allowed: false, reason: claim.message }
  }

  const def = getProvider(input.provider)
  return {
    allowed: false,
    reason: `Tu plan de ${def.shortLabel} permite ${membership.maxDevices} dispositivo(s). Este dispositivo no está autorizado. Contacta soporte por WhatsApp.`,
  }
}

export async function listUserDevices(userId: string) {
  return prisma.membershipDevice.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    include: {
      membership: {
        select: {
          id: true,
          status: true,
          maxDevices: true,
          endsAt: true,
          plan: true,
        },
      },
    },
  })
}

export async function listMembershipDevices(membershipId: string) {
  return prisma.membershipDevice.findMany({
    where: { membershipId },
    orderBy: { lastSeenAt: "desc" },
  })
}

export async function revokeDevice(input: {
  deviceId: string
  ownerUserId?: string
}) {
  const device = await prisma.membershipDevice.findUnique({
    where: { id: input.deviceId },
  })
  if (!device) {
    throw new Error("Dispositivo no encontrado")
  }
  if (input.ownerUserId && device.userId !== input.ownerUserId) {
    throw new Error("No puedes quitar este dispositivo")
  }
  await prisma.membershipDevice.delete({ where: { id: device.id } })
  return device
}

export async function countDevicesForMembership(membershipId: string) {
  return prisma.membershipDevice.count({ where: { membershipId } })
}
