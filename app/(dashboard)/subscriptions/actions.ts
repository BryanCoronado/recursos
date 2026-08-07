"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  MAX_DEVICES,
  MIN_DEVICES,
  SUBSCRIPTION_PLANS,
  whatsappMembershipReadyUrl,
} from "@/lib/billing/plans"
import {
  cancelMembership,
  createMembership,
  updateMembershipMaxDevices,
} from "@/lib/billing/membership"
import { revokeDevice } from "@/lib/billing/devices"
import { ensureClientRoleForProvider } from "@/lib/auth/client-roles"
import {
  getProvider,
  requireProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

export type MembershipActionState = {
  error?: string
  ok?: string
  /** Link WhatsApp para avisar al cliente que su plan está listo */
  notifyWhatsAppUrl?: string
  membershipId?: string
}

const createSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  maxDevices: z.coerce.number().int().min(MIN_DEVICES).max(MAX_DEVICES),
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
    maxDevices: formData.get("maxDevices") || "1",
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
      maxDevices: parsed.data.maxDevices,
      createdById: admin.id,
      notes: parsed.data.notes,
    })
    // Asegura acceso al panel del proveedor (rol cliente)
    await ensureClientRoleForProvider(
      parsed.data.userId,
      provider,
      admin.id
    )
    revalidatePath("/subscriptions")
    revalidatePath("/recharge")
    revalidatePath("/devices")
    revalidatePath("/dashboard")
    revalidatePath("/users")
    revalidatePath(getProvider(provider).dashboardPath)
    const label = SUBSCRIPTION_PLANS[parsed.data.plan].label

    const client = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { name: true, phone: true },
    })
    const notifyWhatsAppUrl =
      client?.phone
        ? whatsappMembershipReadyUrl({
            phone: client.phone,
            userName: client.name,
            provider,
            plan: parsed.data.plan,
            endsAt: membership.endsAt,
          })
        : null

    return {
      ok: `${getProvider(provider).shortLabel} · ${label} · ${membership.maxDevices} disp. · S/ ${Number(membership.totalPriceSoles)} · hasta ${membership.endsAt.toLocaleString("es")}`,
      notifyWhatsAppUrl: notifyWhatsAppUrl ?? undefined,
      membershipId: membership.id,
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
  revalidatePath("/devices")
  revalidatePath("/envato")
  revalidatePath("/magnific")
}

export async function updateMaxDevicesAction(formData: FormData) {
  await requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  const membershipId = String(formData.get("membershipId") ?? "")
  const maxDevices = Number(formData.get("maxDevices") ?? 1)
  await updateMembershipMaxDevices({ membershipId, maxDevices })
  revalidatePath("/subscriptions")
  revalidatePath("/devices")
  revalidatePath("/recharge")
}

export async function adminRevokeDeviceAction(formData: FormData) {
  await requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  const deviceId = String(formData.get("deviceId") ?? "")
  await revokeDevice({ deviceId })
  revalidatePath("/subscriptions")
  revalidatePath("/devices")
}
