import { AppShell, type ShellIconName } from "@/components/layout/app-shell"
import { DeviceSessionGuard } from "@/components/billing/device-session-guard"
import { hasPermission, requireUser } from "@/lib/auth/authorization"
import { PERMISSIONS, type PermissionKey } from "@/lib/auth/permissions"

const navigation = [
  {
    href: "/dashboard",
    label: "Panel",
    icon: "dashboard",
    permission: PERMISSIONS.DASHBOARD_ACCESS,
  },
  {
    href: "/envato",
    label: "Envato",
    icon: "envato",
    permission: PERMISSIONS.ENVATO_ACCESS,
  },
  {
    href: "/magnific",
    label: "Magnific",
    icon: "magnific",
    permission: PERMISSIONS.MAGNIFIC_ACCESS,
  },
  {
    href: "/sync",
    label: "Sincronización",
    icon: "sync",
    permission: PERMISSIONS.SYNC_ACCESS,
  },
  {
    href: "/automations",
    label: "Automatizaciones",
    icon: "automations",
    permission: PERMISSIONS.AUTOMATIONS_MANAGE,
  },
  {
    href: "/recharge",
    label: "Recarga",
    icon: "recharge",
    permission: PERMISSIONS.RECHARGE_ACCESS,
  },
  {
    href: "/devices",
    label: "Dispositivos",
    icon: "devices",
    anyOf: [
      PERMISSIONS.RECHARGE_ACCESS,
      PERMISSIONS.ENVATO_ACCESS,
      PERMISSIONS.MAGNIFIC_ACCESS,
    ],
  },
  {
    href: "/subscriptions",
    label: "Membresías",
    icon: "subscriptions",
    permission: PERMISSIONS.SUBSCRIPTIONS_MANAGE,
  },
  {
    href: "/users",
    label: "Usuarios",
    icon: "users",
    permission: PERMISSIONS.USERS_READ,
  },
  {
    href: "/roles",
    label: "Roles y permisos",
    icon: "roles",
    permission: PERMISSIONS.ROLES_READ,
  },
  {
    href: "/audit",
    label: "Auditoría",
    icon: "audit",
    permission: PERMISSIONS.AUDIT_READ,
  },
] satisfies Array<{
  href: string
  label: string
  icon: ShellIconName
  permission?: PermissionKey
  anyOf?: PermissionKey[]
}>

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser()
  const visibleNavigation = navigation
    .filter((item) => {
      if (item.anyOf) {
        return item.anyOf.some((p) => hasPermission(user.permissions, p))
      }
      return item.permission
        ? hasPermission(user.permissions, item.permission)
        : false
    })
    .map(({ href, label, icon }) => ({ href, label, icon }))

  return (
    <AppShell
      user={{ name: user.name, roleNames: user.roleNames }}
      navigation={visibleNavigation}
    >
      <DeviceSessionGuard>{children}</DeviceSessionGuard>
    </AppShell>
  )
}
