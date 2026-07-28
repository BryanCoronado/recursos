import "server-only"

import {
  FREE_DOWNLOAD_LIMIT,
  MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  addMonths,
  clampDevices,
  membershipTotalSoles,
  type SubscriptionPlanKey,
} from "@/lib/billing/plans"
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

export async function countProviderDownloadsUsed(
  userId: string,
  provider: ResourceProviderId
) {
  return prisma.downloadJob.count({
    where: {
      requestedById: userId,
      provider,
      status: { in: ["QUEUED", "RUNNING", "DONE"] },
    },
  })
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
  provider: ResourceProviderId
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

  const used = await countProviderDownloadsUsed(userId, provider)
  const remaining = Math.max(0, FREE_DOWNLOAD_LIMIT - used)
  if (remaining <= 0) {
    return {
      allowed: false,
      unlimited: false,
      used,
      remaining: 0,
      reason: `Ya usaste tus ${FREE_DOWNLOAD_LIMIT} descargas gratis de ${def.shortLabel}. Activa una membresía (S/ ${MONTHLY_PRICE_SOLES}/mes) desde Recarga o WhatsApp.`,
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
    where: { membershipId: membership.id },
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

export async function checkEnvatoDownloadAccess(userId: string) {
  return checkProviderDownloadAccess(userId, "ENVATO")
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
