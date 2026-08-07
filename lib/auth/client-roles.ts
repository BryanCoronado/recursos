import "server-only"

import {
  CLIENT_ROLE,
  clientRoleForProvider,
  providerPermission,
} from "@/lib/auth/client-role-defs"
import { type ResourceProviderId } from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

export { CLIENT_ROLE, clientRoleForProvider, providerPermission }

export async function resolveClientRoleId(
  provider: ResourceProviderId
): Promise<string | null> {
  const def = clientRoleForProvider(provider)

  const byKey = await prisma.role.findUnique({
    where: { systemKey: def.systemKey },
    select: { id: true },
  })
  if (byKey) return byKey.id

  if (def.envId) {
    const byEnv = await prisma.role.findUnique({
      where: { id: def.envId },
      select: { id: true },
    })
    if (byEnv) return byEnv.id
  }

  const byName = await prisma.role.findFirst({
    where: { name: def.name },
    select: { id: true },
  })
  return byName?.id ?? null
}

/** Asigna el rol de cliente del proveedor si el usuario aún no lo tiene. */
export async function ensureClientRoleForProvider(
  userId: string,
  provider: ResourceProviderId,
  assignedBy?: string | null
) {
  const roleId = await resolveClientRoleId(provider)
  if (!roleId) return null

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId, roleId },
    },
    update: {},
    create: {
      userId,
      roleId,
      assignedBy: assignedBy ?? null,
    },
  })
  return roleId
}
