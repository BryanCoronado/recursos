import { AppShell, type ShellIconName, type ShellQuotaChip } from "@/components/layout/app-shell"
import { DeviceSessionGuard } from "@/components/billing/device-session-guard"
import type { MembershipWelcomeItem } from "@/components/billing/membership-welcome"
import { hasPermission, requireUser } from "@/lib/auth/authorization"
import { resolveHomePath } from "@/lib/auth/home-path"
import { PERMISSIONS, type PermissionKey } from "@/lib/auth/permissions"
import { freeDownloadContextFromRequest } from "@/lib/billing/free-download-context"
import {
  checkProviderDownloadAccess,
  expireDueMemberships,
} from "@/lib/billing/membership"
import { FREE_DOWNLOAD_LIMIT, type SubscriptionPlanKey } from "@/lib/billing/plans"
import {
  PROVIDERS,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

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
    href: "/downloads",
    label: "Descargas",
    icon: "downloads",
    anyOf: [PERMISSIONS.DOWNLOADS_READ, PERMISSIONS.SYNC_ACCESS],
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

const PROVIDER_PERMS: Array<{
  id: ResourceProviderId
  permission: PermissionKey
}> = [
  { id: "ENVATO", permission: PERMISSIONS.ENVATO_ACCESS },
  { id: "MAGNIFIC", permission: PERMISSIONS.MAGNIFIC_ACCESS },
]

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

  await expireDueMemberships()
  const freeCtx = await freeDownloadContextFromRequest()

  const accessibleProviders = PROVIDER_PERMS.filter((p) =>
    hasPermission(user.permissions, p.permission)
  )

  const quotaChips: ShellQuotaChip[] = await Promise.all(
    accessibleProviders.map(async ({ id }) => {
      const def = PROVIDERS[id]
      const access = await checkProviderDownloadAccess(user.id, id, freeCtx)
      if (access.unlimited) {
        return {
          href: def.dashboardPath,
          label: def.shortLabel,
          logoSrc: def.logoSrc,
          unlimited: true,
        }
      }
      return {
        href: def.dashboardPath,
        label: def.shortLabel,
        logoSrc: def.logoSrc,
        unlimited: false,
        remaining: access.remaining,
        total: FREE_DOWNLOAD_LIMIT,
      }
    })
  )

  const since = new Date()
  since.setDate(since.getDate() - 14)
  const recentMemberships = await prisma.membership.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      provider: true,
      plan: true,
      endsAt: true,
      createdAt: true,
    },
  })

  const membershipWelcome: MembershipWelcomeItem[] = recentMemberships.map(
    (m) => ({
      id: m.id,
      provider: m.provider as ResourceProviderId,
      plan: m.plan as SubscriptionPlanKey,
      endsAt: m.endsAt.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })
  )

  return (
    <AppShell
      user={{ name: user.name, roleNames: user.roleNames }}
      navigation={visibleNavigation}
      homeHref={resolveHomePath(user.permissions)}
      quotaChips={quotaChips}
      membershipWelcome={membershipWelcome}
    >
      <DeviceSessionGuard>{children}</DeviceSessionGuard>
    </AppShell>
  )
}
