import "server-only"

import {
  ENVATO_FREE_DOWNLOAD_LIMIT,
  ENVATO_MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  addMonths,
  type SubscriptionPlanKey,
} from "@/lib/billing/envato"
import { prisma } from "@/lib/prisma"

/** Marca como EXPIRED las membresías ACTIVE cuya fecha ya pasó. */
export async function expireDueMemberships(provider: "ENVATO" | "MAGNIFIC" = "ENVATO") {
  const now = new Date()
  await prisma.membership.updateMany({
    where: {
      provider,
      status: "ACTIVE",
      endsAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  })
}

export async function getActiveEnvatoMembership(userId: string) {
  await expireDueMemberships("ENVATO")
  const now = new Date()
  return prisma.membership.findFirst({
    where: {
      userId,
      provider: "ENVATO",
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
  })
}

export async function countEnvatoDownloadsUsed(userId: string) {
  return prisma.downloadJob.count({
    where: {
      requestedById: userId,
      provider: "ENVATO",
      status: { in: ["QUEUED", "RUNNING", "DONE"] },
    },
  })
}

export type EnvatoAccessResult =
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

export async function checkEnvatoDownloadAccess(
  userId: string
): Promise<EnvatoAccessResult> {
  const membership = await getActiveEnvatoMembership(userId)
  if (membership) {
    return {
      allowed: true,
      unlimited: true,
      membershipEndsAt: membership.endsAt,
    }
  }

  const used = await countEnvatoDownloadsUsed(userId)
  const remaining = Math.max(0, ENVATO_FREE_DOWNLOAD_LIMIT - used)
  if (remaining <= 0) {
    return {
      allowed: false,
      unlimited: false,
      used,
      remaining: 0,
      reason: `Ya usaste tus ${ENVATO_FREE_DOWNLOAD_LIMIT} descargas gratis. Activa una membresía Envato (S/ ${ENVATO_MONTHLY_PRICE_SOLES}/mes) desde Recarga o WhatsApp.`,
    }
  }

  return {
    allowed: true,
    unlimited: false,
    used,
    remaining,
  }
}

export async function createEnvatoMembership(input: {
  userId: string
  plan: SubscriptionPlanKey
  createdById: string
  notes?: string
  startFrom?: Date
}) {
  await expireDueMemberships("ENVATO")

  const plan = SUBSCRIPTION_PLANS[input.plan]
  const now = input.startFrom ?? new Date()

  const current = await getActiveEnvatoMembership(input.userId)
  // Si ya tiene activa, la nueva empieza cuando termine la actual
  const startsAt = current && current.endsAt > now ? current.endsAt : now
  const endsAt = addMonths(startsAt, plan.months)
  const monthly = ENVATO_MONTHLY_PRICE_SOLES
  const total = plan.totalSoles

  return prisma.membership.create({
    data: {
      userId: input.userId,
      provider: "ENVATO",
      plan: input.plan,
      months: plan.months,
      monthlyPriceSoles: monthly,
      totalPriceSoles: total,
      status: "ACTIVE",
      startsAt,
      endsAt,
      createdById: input.createdById,
      notes: input.notes || null,
    },
  })
}

export async function cancelEnvatoMembership(input: {
  membershipId: string
  cancelledById: string
}) {
  const membership = await prisma.membership.findUnique({
    where: { id: input.membershipId },
  })
  if (!membership || membership.provider !== "ENVATO") {
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
      // Al cancelar manual, corta el acceso de inmediato
      endsAt: new Date(),
    },
  })
}
