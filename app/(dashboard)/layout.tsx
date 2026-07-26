import { AppShell, type ShellIconName } from "@/components/layout/app-shell"
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
  permission: PermissionKey
}>

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser()
  const visibleNavigation = navigation
    .filter((item) => hasPermission(user.permissions, item.permission))
    .map(({ href, label, icon }) => ({ href, label, icon }))

  return (
    <AppShell
      user={{ name: user.name, roleNames: user.roleNames }}
      navigation={visibleNavigation}
    >
      {children}
    </AppShell>
  )
}
