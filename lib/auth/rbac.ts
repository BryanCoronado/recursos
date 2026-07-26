import type { PermissionKey } from "@/lib/auth/permissions"

export function hasPermission(
  permissions: readonly string[],
  permission: PermissionKey
) {
  return permissions.includes(permission)
}

export function canGrantPermissions(
  actorPermissions: readonly string[],
  requestedPermissions: readonly string[]
) {
  return requestedPermissions.every((permission) =>
    actorPermissions.includes(permission)
  )
}

export function canManageTargetRole(
  actorIsSuperAdmin: boolean,
  targetIsSuperAdmin: boolean
) {
  return actorIsSuperAdmin || !targetIsSuperAdmin
}

export function canRemoveSuperAdmin(
  targetIsSuperAdmin: boolean,
  superAdminCount: number
) {
  return !targetIsSuperAdmin || superAdminCount > 1
}

export function canDeleteRole(isSystem: boolean, assignedUsers: number) {
  return !isSystem && assignedUsers === 0
}
