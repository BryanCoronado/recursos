import "server-only"

import {
  FREE_DOWNLOAD_LIMIT,
  FREE_DOWNLOAD_PER_IP_LIMIT,
  MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  addMonths,
  clampDevices,
  membershipTotalSoles,
  type SubscriptionPlanKey,
} from "@/lib/billing/plans"
import { hashDeviceFingerprint } from "@/lib/billing/fingerprint"
import { getProvider, type ResourceProviderId } from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

export async function expireDueMemberships(
  provider?: ResourceProviderId
) {
  const now = new Date()
  await prisma.membership.updateMany({
    where: {
      ...(provider ? { provider } : {}),
      status: "ACTIVE",
      endsAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  })
}

export async function getActiveMembership(
  userId: string,
  provider: ResourceProviderId
) {
  await expireDueMemberships(provider)
  const now = new Date()
  return prisma.membership.findFirst({
    where: {
      userId,
      provider,
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
  })
}

const FREE_STATUSES = ["QUEUED", "RUNNING", "DONE"] as const

export async function countProviderDownloadsUsed(
  userId: string,
  provider: ResourceProviderId
) {
  return prisma.downloadJob.count({
    where: {
      requestedById: userId,
      provider,
      status: { in: [...FREE_STATUSES] },
    },
  })
}

async function countFreeDownloadsByDevice(
  provider: ResourceProviderId,
  deviceKey: string
) {
  return prisma.downloadJob.count({
    where: {
      provider,
      deviceKey,
      status: { in: [...FREE_STATUSES] },
    },
  })
}

async function countFreeDownloadsByIp(
  provider: ResourceProviderId,
  clientIp: string
) {
  return prisma.downloadJob.count({
    where: {
      provider,
      clientIp,
      status: { in: [...FREE_STATUSES] },
    },
  })
}

export type FreeDownloadContext = {
  rawDeviceId?: string | null
  clientIp?: string | null
}

export type DownloadAccessResult =
  | { allowed: true; unlimited: true; membershipEndsAt: Date }
  | {
      allowed: true
      unlimited: false
      used: number
      remaining: number
    }
  | {
      allowed: false
      unlimited: false
      used: number
      remaining: 0
      reason: string
    }

export async function checkProviderDownloadAccess(
  userId: string,
  provider: ResourceProviderId,
  ctx: FreeDownloadContext = {}
): Promise<DownloadAccessResult> {
  const def = getProvider(provider)
  const membership = await getActiveMembership(userId, provider)
  if (membership) {
    return {
      allowed: true,
      unlimited: true,
      membershipEndsAt: membership.endsAt,
    }
  }

  const usedByUser = await countProviderDownloadsUsed(userId, provider)
  let used = usedByUser

  const rawDevice = ctx.rawDeviceId?.trim()
  if (rawDevice && rawDevice.length >= 8) {
    const deviceKey = hashDeviceFingerprint(rawDevice)
    const usedByDevice = await countFreeDownloadsByDevice(provider, deviceKey)
    used = Math.max(used, usedByDevice)
  }

  if (ctx.clientIp) {
    const usedByIp = await countFreeDownloadsByIp(provider, ctx.clientIp)
    if (usedByIp >= FREE_DOWNLOAD_PER_IP_LIMIT) {
      return {
        allowed: false,
        unlimited: false,
        used: Math.max(used, FREE_DOWNLOAD_LIMIT),
        remaining: 0,
        reason: `Se alcanzó el límite de pruebas gratis desde esta red para ${def.shortLabel}. Activa una membresía (S/ ${MONTHLY_PRICE_SOLES}/mes) o escríbenos por WhatsApp.`,
      }
    }
  }

  const remaining = Math.max(0, FREE_DOWNLOAD_LIMIT - used)
  if (remaining <= 0) {
    return {
      allowed: false,
      unlimited: false,
      used,
      remaining: 0,
      reason: `Ya usaste las ${FREE_DOWNLOAD_LIMIT} descargas gratis de ${def.shortLabel} en esta cuenta o dispositivo. Activa una membresía (S/ ${MONTHLY_PRICE_SOLES}/mes) desde Recarga o WhatsApp.`,
    }
  }

  return {
    allowed: true,
    unlimited: false,
    used,
    remaining,
  }
}

export async function createMembership(input: {
  userId: string
  provider: ResourceProviderId
  plan: SubscriptionPlanKey
  createdById: string
  notes?: string
  startFrom?: Date
  maxDevices?: number
}) {
  await expireDueMemberships(input.provider)

  const plan = SUBSCRIPTION_PLANS[input.plan]
  const maxDevices = clampDevices(input.maxDevices ?? 1)
  const totalPriceSoles = membershipTotalSoles(input.plan, maxDevices)
  const now = input.startFrom ?? new Date()
  const current = await getActiveMembership(input.userId, input.provider)
  const startsAt = current && current.endsAt > now ? current.endsAt : now
  const endsAt = addMonths(startsAt, plan.months)

  return prisma.membership.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      plan: input.plan,
      months: plan.months,
      monthlyPriceSoles: MONTHLY_PRICE_SOLES,
      totalPriceSoles,
      maxDevices,
      status: "ACTIVE",
      startsAt,
      endsAt,
      createdById: input.createdById,
      notes: input.notes || null,
    },
  })
}

export async function updateMembershipMaxDevices(input: {
  membershipId: string
  maxDevices: number
}) {
  const membership = await prisma.membership.findUnique({
    where: { id: input.membershipId },
  })
  if (!membership) {
    throw new Error("Membresía no encontrada")
  }
  if (membership.status !== "ACTIVE") {
    throw new Error("Solo se pueden editar membresías activas")
  }

  const maxDevices = clampDevices(input.maxDevices)
  const deviceCount = await prisma.membershipDevice.count({
    where: {
      userId: membership.userId,
      provider: membership.provider,
    },
  })
  if (maxDevices < deviceCount) {
    throw new Error(
      `Hay ${deviceCount} dispositivo(s) registrados. Quita alguno antes de bajar el cupo a ${maxDevices}.`
    )
  }

  return prisma.membership.update({
    where: { id: membership.id },
    data: { maxDevices },
  })
}

export async function cancelMembership(input: {
  membershipId: string
  cancelledById: string
}) {
  const membership = await prisma.membership.findUnique({
    where: { id: input.membershipId },
  })
  if (!membership) {
    throw new Error("Membresía no encontrada")
  }
  if (membership.status !== "ACTIVE") {
    throw new Error("Solo se pueden cancelar membresías activas")
  }

  return prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledById: input.cancelledById,
      endsAt: new Date(),
    },
  })
}

/** Compat Envato */
export async function getActiveEnvatoMembership(userId: string) {
  return getActiveMembership(userId, "ENVATO")
}

export async function checkEnvatoDownloadAccess(
  userId: string,
  ctx?: FreeDownloadContext
) {
  return checkProviderDownloadAccess(userId, "ENVATO", ctx)
}

export async function createEnvatoMembership(input: {
  userId: string
  plan: SubscriptionPlanKey
  createdById: string
  notes?: string
  startFrom?: Date
  maxDevices?: number
}) {
  return createMembership({ ...input, provider: "ENVATO" })
}

export async function cancelEnvatoMembership(input: {
  membershipId: string
  cancelledById: string
}) {
  return cancelMembership(input)
}

export type EnvatoAccessResult = DownloadAccessResult
