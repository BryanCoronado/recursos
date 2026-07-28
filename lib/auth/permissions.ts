export const PERMISSIONS = {
  DASHBOARD_ACCESS: "dashboard:access",
  ENVATO_ACCESS: "envato:access",
  MAGNIFIC_ACCESS: "magnific:access",
  SYNC_ACCESS: "sync:access",
  AUTOMATIONS_MANAGE: "automations:manage",
  SUBSCRIPTIONS_MANAGE: "subscriptions:manage",
  RECHARGE_ACCESS: "recharge:access",
  DOWNLOADS_READ: "downloads:read",
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_STATUS: "users:status",
  USERS_RESET_PASSWORD: "users:reset-password",
  ROLES_READ: "roles:read",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  AUDIT_READ: "audit:read",
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const PERMISSION_DEFINITIONS = [
  { key: PERMISSIONS.DASHBOARD_ACCESS, module: "dashboard", action: "access", label: "Acceder al panel" },
  { key: PERMISSIONS.ENVATO_ACCESS, module: "envato", action: "access", label: "Acceder a Envato" },
  { key: PERMISSIONS.MAGNIFIC_ACCESS, module: "magnific", action: "access", label: "Acceder a Magnific" },
  { key: PERMISSIONS.SYNC_ACCESS, module: "sync", action: "access", label: "Gestionar sincronización" },
  {
    key: PERMISSIONS.AUTOMATIONS_MANAGE,
    module: "automations",
    action: "manage",
    label: "Gestionar automatizaciones",
  },
  {
    key: PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    module: "subscriptions",
    action: "manage",
    label: "Gestionar membresías",
  },
  {
    key: PERMISSIONS.RECHARGE_ACCESS,
    module: "recharge",
    action: "access",
    label: "Acceder a recarga y soporte",
  },
  {
    key: PERMISSIONS.DOWNLOADS_READ,
    module: "downloads",
    action: "read",
    label: "Ver descargas de todos los usuarios",
  },
  { key: PERMISSIONS.USERS_READ, module: "users", action: "read", label: "Ver usuarios" },
  { key: PERMISSIONS.USERS_CREATE, module: "users", action: "create", label: "Crear usuarios" },
  { key: PERMISSIONS.USERS_UPDATE, module: "users", action: "update", label: "Editar usuarios" },
  { key: PERMISSIONS.USERS_STATUS, module: "users", action: "status", label: "Activar o suspender usuarios" },
  {
    key: PERMISSIONS.USERS_RESET_PASSWORD,
    module: "users",
    action: "reset-password",
    label: "Restablecer contraseñas",
  },
  { key: PERMISSIONS.ROLES_READ, module: "roles", action: "read", label: "Ver roles" },
  { key: PERMISSIONS.ROLES_CREATE, module: "roles", action: "create", label: "Crear roles" },
  { key: PERMISSIONS.ROLES_UPDATE, module: "roles", action: "update", label: "Editar roles" },
  { key: PERMISSIONS.ROLES_DELETE, module: "roles", action: "delete", label: "Eliminar roles" },
  { key: PERMISSIONS.AUDIT_READ, module: "audit", action: "read", label: "Ver auditoría" },
] as const

export const ALL_PERMISSION_KEYS = PERMISSION_DEFINITIONS.map(({ key }) => key)
