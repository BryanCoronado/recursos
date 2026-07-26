"use server"

import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import {
  canGrantPermissions,
  requirePermission,
} from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  canManageTargetRole,
  canRemoveSuperAdmin,
} from "@/lib/auth/rbac"
import { prisma } from "@/lib/prisma"

export type UserActionState = {
  error?: string
}

const userSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(12, "La contraseña temporal debe tener al menos 12 caracteres").optional(),
})

async function validateAssignableRoles(
  actor: Awaited<ReturnType<typeof requirePermission>>,
  roleIds: string[]
) {
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
    select: {
      id: true,
      systemKey: true,
      permissions: {
        select: { permission: { select: { key: true } } },
      },
    },
  })

  if (roles.length !== new Set(roleIds).size) return false
  if (actor.isSuperAdmin) return true
  if (roles.some((role) => role.systemKey === "SUPER_ADMIN")) return false

  return roles.every((role) =>
    canGrantPermissions(
      actor.permissions,
      role.permissions.map(({ permission }) => permission.key)
    )
  )
}

export async function createUser(
  _state: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const actor = await requirePermission(PERMISSIONS.USERS_CREATE)
  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })
  const roleIds = formData.getAll("roleIds").map(String)

  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  if (!parsed.data.password) return { error: "La contraseña temporal es obligatoria" }
  if (!(await validateAssignableRoles(actor, roleIds))) {
    return { error: "No puedes asignar uno o más de los roles seleccionados" }
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })
  if (exists) return { error: "Ya existe un usuario con ese correo" }

  const passwordHash = await hash(parsed.data.password, 12)
  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        createdById: actor.id,
        mustChangePassword: true,
        roles: {
          create: roleIds.map((roleId) => ({
            assignedBy: actor.id,
            role: { connect: { id: roleId } },
          })),
        },
      },
    })
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "USER_CREATED",
        entityType: "User",
        entityId: createdUser.id,
        metadata: { email: parsed.data.email, roleIds },
      },
    })
    return createdUser
  })

  redirect(`/users/${user.id}`)
}

export async function updateUser(
  _state: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const actor = await requirePermission(PERMISSIONS.USERS_UPDATE)
  const userId = String(formData.get("userId") ?? "")
  const parsed = userSchema.omit({ password: true }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  })
  const roleIds = formData.getAll("roleIds").map(String)

  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  if (!(await validateAssignableRoles(actor, roleIds))) {
    return { error: "No puedes asignar uno o más de los roles seleccionados" }
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: { select: { role: { select: { systemKey: true } } } },
    },
  })
  if (!target) return { error: "Usuario no encontrado" }

  const targetIsSuper = target.roles.some(({ role }) => role.systemKey === "SUPER_ADMIN")
  if (!canManageTargetRole(actor.isSuperAdmin, targetIsSuper)) {
    return { error: "Solo otro superadministrador puede modificar esta cuenta" }
  }

  const keepsSuperRole = await prisma.role.count({
    where: { id: { in: roleIds }, systemKey: "SUPER_ADMIN" },
  })
  if (targetIsSuper && !keepsSuperRole) {
    const superAdminCount = await prisma.userRole.count({
      where: { role: { systemKey: "SUPER_ADMIN" } },
    })
    if (!canRemoveSuperAdmin(true, superAdminCount)) {
      return { error: "No puedes quitar el rol al último superadministrador" }
    }
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { name: parsed.data.name, email: parsed.data.email },
      }),
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
          assignedBy: actor.id,
        })),
      }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "USER_UPDATED",
          entityType: "User",
          entityId: userId,
          metadata: { roleIds },
        },
      }),
    ])
  } catch {
    return { error: "No se pudo actualizar; verifica que el correo sea único" }
  }

  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
  return {}
}

export async function setUserStatus(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.USERS_STATUS)
  const userId = String(formData.get("userId") ?? "")
  const status = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).parse(formData.get("status"))

  if (userId === actor.id && status !== "ACTIVE") {
    throw new Error("No puedes desactivar tu propia cuenta")
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: { select: { role: { select: { systemKey: true } } } },
    },
  })
  if (!target) throw new Error("Usuario no encontrado")

  const targetIsSuper = target.roles.some(({ role }) => role.systemKey === "SUPER_ADMIN")
  if (!canManageTargetRole(actor.isSuperAdmin, targetIsSuper)) {
    throw new Error("No puedes cambiar el estado de esta cuenta")
  }
  if (targetIsSuper && status !== "ACTIVE") {
    const count = await prisma.userRole.count({
      where: { role: { systemKey: "SUPER_ADMIN" }, user: { status: "ACTIVE" } },
    })
    if (!canRemoveSuperAdmin(true, count)) {
      throw new Error("No puedes suspender al último superadministrador activo")
    }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "USER_STATUS_CHANGED",
        entityType: "User",
        entityId: userId,
        metadata: { status },
      },
    }),
  ])
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function resetUserPassword(
  _state: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const actor = await requirePermission(PERMISSIONS.USERS_RESET_PASSWORD)
  const userId = String(formData.get("userId") ?? "")
  const parsed = z.string().min(12, "Usa al menos 12 caracteres").safeParse(formData.get("password"))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: { select: { role: { select: { systemKey: true } } } },
    },
  })
  if (!target) return { error: "Usuario no encontrado" }
  const targetIsSuper = target.roles.some(({ role }) => role.systemKey === "SUPER_ADMIN")
  if (!canManageTargetRole(actor.isSuperAdmin, targetIsSuper)) {
    return { error: "No puedes restablecer la contraseña de esta cuenta" }
  }

  const passwordHash = await hash(parsed.data, 12)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: userId,
      },
    }),
  ])
  return {}
}
