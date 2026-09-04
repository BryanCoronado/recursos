import { AlertTriangle, CheckCircle2, Users, Wallet } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import {
  MembershipsTable,
  type MembershipRow,
} from "@/components/admin/memberships-table"
import { NewMembershipPanel } from "@/components/admin/new-membership-panel"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  EXTRA_DEVICE_MONTHLY_SOLES,
  FREE_DOWNLOAD_LIMIT,
  MONTHLY_PRICE_SOLES,
  type SubscriptionPlanKey,
} from "@/lib/billing/plans"
import { expireDueMemberships } from "@/lib/billing/membership"
import {
  PROVIDERS,
  providerList,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

const WEEK_MS = 7 * 86_400_000

export default async function SubscriptionsPage() {
  const access = await requirePagePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Membresías" />

  await expireDueMemberships()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [users, memberships, monthRevenue] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        memberships: {
          where: { status: "ACTIVE", endsAt: { gt: now } },
          select: { provider: true },
        },
      },
    }),
    prisma.membership.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
        devices: {
          orderBy: { lastSeenAt: "desc" },
          select: { id: true, label: true, lastSeenAt: true },
        },
      },
    }),
    prisma.membership.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { totalPriceSoles: true },
      _count: true,
    }),
  ])

  const rows: MembershipRow[] = memberships.map((item) => {
    const provider = PROVIDERS[item.provider as ResourceProviderId]
    return {
      id: item.id,
      provider: item.provider,
      providerLabel: provider?.shortLabel ?? item.provider,
      providerLogo: provider?.logoSrc ?? "/envato.png",
      plan: item.plan as SubscriptionPlanKey,
      status: item.status as MembershipRow["status"],
      totalPriceSoles: Number(item.totalPriceSoles),
      maxDevices: item.maxDevices,
      startsAt: item.startsAt.toISOString(),
      endsAt: item.endsAt.toISOString(),
      userName: item.user.name,
      userEmail: item.user.email,
      devices: item.devices.map((d) => ({
        id: d.id,
        label: d.label,
        lastSeenAt: d.lastSeenAt.toISOString(),
      })),
    }
  })

  const activeRows = rows.filter((r) => r.status === "ACTIVE")
  const expiringSoon = activeRows.filter(
    (r) => new Date(r.endsAt).getTime() - now.getTime() <= WEEK_MS
  ).length
  const revenue = Number(monthRevenue._sum.totalPriceSoles ?? 0)

  const stats = [
    {
      icon: CheckCircle2,
      label: "Membresías activas",
      value: String(activeRows.length),
      hint: `${rows.length} registradas en total`,
    },
    {
      icon: AlertTriangle,
      label: "Vencen en 7 días",
      value: String(expiringSoon),
      hint: "Avisa por WhatsApp antes del corte",
    },
    {
      icon: Wallet,
      label: "Cobrado este mes",
      value: `S/ ${revenue}`,
      hint: `${monthRevenue._count} activaciones`,
    },
    {
      icon: Users,
      label: "Clientes activos",
      value: String(users.length),
      hint: `Sin plan: ${FREE_DOWNLOAD_LIMIT} descargas gratis`,
    },
  ]

  const pickerUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    activeProviders: user.memberships.map(
      (m) => PROVIDERS[m.provider as ResourceProviderId]?.shortLabel ?? m.provider
    ),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-3xl">
          Membresías
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--mich-muted)]">
          Activa planes desde S/ {MONTHLY_PRICE_SOLES}/mes. 1 dispositivo
          incluido; +S/ {EXTRA_DEVICE_MONTHLY_SOLES}/mes por cada extra.
        </p>
      </div>

      <NewMembershipPanel users={pickerUsers} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="mich-soft-card px-4 py-4">
            <div className="flex items-center gap-2">
              <stat.icon className="size-4 text-[var(--mich-blue)]" />
              <p className="text-[12px] text-[var(--mich-muted)]">
                {stat.label}
              </p>
            </div>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-[var(--mich-muted)]">{stat.hint}</p>
          </div>
        ))}
      </div>

      <MembershipsTable
        memberships={rows}
        providers={providerList().map((p) => ({
          id: p.id,
          shortLabel: p.shortLabel,
        }))}
      />
    </div>
  )
}
