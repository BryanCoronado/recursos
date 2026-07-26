"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import {
  canGrantPermissions,
  requirePermission,
} from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { canDeleteRole } from "@/lib/auth/rbac"
import { prisma } from "@/lib/prisma"

export type RoleActionState = {
  error?: string
}

const roleSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  description: z.string().trim().max(240).optional(),
})

async function getGrantablePermissionIds(
  actorPermissions: readonly string[],
  permissionIds: string[]
) {
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { id: true, key: true },
  })
  if (permissions.length !== new Set(permissionIds).size) return null
  return canGrantPermissions(
    actorPermissions,
    permissions.map(({ key }) => key)
  )
    ? permissions
    : null
}

export async function createRole(
  _state: RoleActionState,
  formData: FormData
): Promise<RoleActionState> {
  const actor = await requirePermission(PERMISSIONS.ROLES_CREATE)
  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })
  const permissionIds = formData.getAll("permissionIds").map(String)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const permissions = await getGrantablePermissionIds(
    actor.permissions,
    permissionIds
  )
  if (!permissions) return { error: "No puedes conceder uno o más permisos" }

  const duplicate = await prisma.role.findUnique({
    where: { name: parsed.data.name },
    select: { id: true },
  })
  if (duplicate) return { error: "Ya existe un rol con ese nombre" }

  const role = await prisma.$transaction(async (transaction) => {
    const createdRole = await transaction.role.create({
      data: {
        ...parsed.data,
        permissions: {
          create: permissions.map(({ id }) => ({
            permission: { connect: { id } },
          })),
        },
      },
    })
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "ROLE_CREATED",
        entityType: "Role",
        entityId: createdRole.id,
        metadata: { permissionIds },
      },
    })
    return createdRole
  })

  redirect(`/roles/${role.id}`)
}

export async function updateRole(
  _state: RoleActionState,
  formData: FormData
): Promise<RoleActionState> {
  const actor = await requirePermission(PERMISSIONS.ROLES_UPDATE)
  const roleId = String(formData.get("roleId") ?? "")
  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })
  const permissionIds = formData.getAll("permissionIds").map(String)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const target = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      isSystem: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
  })
  if (!target) return { error: "Rol no encontrado" }
  if (target.isSystem) return { error: "Los roles del sistema están protegidos" }
  if (
    !canGrantPermissions(
      actor.permissions,
      target.permissions.map(({ permission }) => permission.key)
    )
  ) {
    return { error: "Este rol contiene permisos que no puedes administrar" }
  }

  const permissions = await getGrantablePermissionIds(
    actor.permissions,
    permissionIds
  )
  if (!permissions) return { error: "No puedes conceder uno o más permisos" }

  try {
    await prisma.$transaction([
      prisma.role.update({ where: { id: roleId }, data: parsed.data }),
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({
        data: permissions.map(({ id }) => ({ roleId, permissionId: id })),
      }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "ROLE_UPDATED",
          entityType: "Role",
          entityId: roleId,
          metadata: { permissionIds },
        },
      }),
    ])
  } catch {
    return { error: "No se pudo actualizar; verifica que el nombre sea único" }
  }

  revalidatePath("/roles")
  revalidatePath(`/roles/${roleId}`)
  return {}
}

export async function deleteRole(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.ROLES_DELETE)
  const roleId = String(formData.get("roleId") ?? "")
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { isSystem: true, _count: { select: { users: true } } },
  })
  if (!role || !canDeleteRole(role.isSystem, role._count.users)) {
    throw new Error("No se puede eliminar un rol del sistema o con usuarios asignados")
  }

  await prisma.$transaction([
    prisma.role.delete({ where: { id: roleId } }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "ROLE_DELETED",
        entityType: "Role",
        entityId: roleId,
      },
    }),
  ])
  redirect("/roles")
}
