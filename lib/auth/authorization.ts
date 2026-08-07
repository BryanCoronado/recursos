import "server-only"

import { cache } from "react"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth/config"
import type { PermissionKey } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export { canGrantPermissions, hasPermission } from "@/lib/auth/rbac"

export class AuthorizationError extends Error {
  constructor(message = "No tienes permiso para realizar esta acción") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export type CurrentUser = {
  id: string
  email: string
  name: string
  country: string | null
  phone: string | null
  mustChangePassword: boolean
  roleIds: string[]
  roleNames: string[]
  permissions: PermissionKey[]
  isSuperAdmin: boolean
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      country: true,
      phone: true,
      status: true,
      mustChangePassword: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              systemKey: true,
              permissions: {
                select: {
                  permission: { select: { key: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user || user.status !== "ACTIVE") return null

  const permissionSet = new Set(
    user.roles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.key as PermissionKey)
    )
  )

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    country: user.country,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
    roleIds: user.roles.map(({ role }) => role.id),
    roleNames: user.roles.map(({ role }) => role.name),
    permissions: [...permissionSet],
    isSuperAdmin: user.roles.some(({ role }) => role.systemKey === "SUPER_ADMIN"),
  }
})

export async function requireUser(options?: {
  allowPasswordChange?: boolean
  allowIncompleteProfile?: boolean
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.mustChangePassword && !options?.allowPasswordChange) {
    redirect("/change-password")
  }
  const needsProfile = !user.phone?.trim() || !user.country?.trim()
  if (needsProfile && !options?.allowIncompleteProfile) {
    redirect("/complete-profile")
  }
  return user
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireUser()
  if (!user.permissions.includes(permission)) {
    throw new AuthorizationError()
  }
  return user
}

export async function requirePagePermission(permission: PermissionKey) {
  const user = await requireUser()
  if (!user.permissions.includes(permission)) {
    return { user: null, allowed: false as const }
  }
  return { user, allowed: true as const }
}

