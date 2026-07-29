import { hasPermission } from "@/lib/auth/rbac"
import { PERMISSIONS, type PermissionKey } from "@/lib/auth/permissions"

/**
 * Ruta de inicio según permisos del usuario.
 * Clientes Envato no suelen tener dashboard:access → van a /envato.
 */
export function resolveHomePath(permissions: PermissionKey[]): string {
  if (hasPermission(permissions, PERMISSIONS.DASHBOARD_ACCESS)) {
    return "/dashboard"
  }
  if (hasPermission(permissions, PERMISSIONS.ENVATO_ACCESS)) {
    return "/envato"
  }
  if (hasPermission(permissions, PERMISSIONS.MAGNIFIC_ACCESS)) {
    return "/magnific"
  }
  if (hasPermission(permissions, PERMISSIONS.RECHARGE_ACCESS)) {
    return "/recharge"
  }
  if (hasPermission(permissions, PERMISSIONS.SYNC_ACCESS)) {
    return "/sync"
  }
  return "/dashboard"
}
