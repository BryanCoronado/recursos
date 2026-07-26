"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { SUBSCRIPTION_PLANS } from "@/lib/billing/plans"
import {
  cancelMembership,
  createMembership,
} from "@/lib/billing/membership"
import {
  getProvider,
  requireProviderId,
} from "@/lib/providers/catalog"

export type MembershipActionState = {
  error?: string
  ok?: string
}

const createSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  notes: z.string().trim().max(500).optional(),
})

export async function activateMembership(
  _state: MembershipActionState,
  formData: FormData
): Promise<MembershipActionState> {
  const admin = await requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE)

  let provider
  try {
    provider = requireProviderId(formData.get("provider"))
  } catch {
    return { error: "Elige un proveedor" }
  }

  const parsed = createSchema.safeParse({
    userId: formData.get("userId"),
    plan: formData.get("plan"),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const membership = await createMembership({
      userId: parsed.data.userId,
      provider,
      plan: parsed.data.plan,
      createdById: admin.id,
      notes: parsed.data.notes,
    })
    revalidatePath("/subscriptions")
    revalidatePath("/recharge")
    revalidatePath(getProvider(provider).dashboardPath)
    const label = SUBSCRIPTION_PLANS[parsed.data.plan].label
    return {
      ok: `${getProvider(provider).shortLabel} · ${label} hasta ${membership.endsAt.toLocaleString("es")}`,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo activar",
    }
  }
}

export async function cancelMembershipAction(formData: FormData) {
  const admin = await requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  const membershipId = String(formData.get("membershipId") ?? "")
  await cancelMembership({
    membershipId,
    cancelledById: admin.id,
  })
  revalidatePath("/subscriptions")
  revalidatePath("/recharge")
  revalidatePath("/envato")
  revalidatePath("/magnific")
}
