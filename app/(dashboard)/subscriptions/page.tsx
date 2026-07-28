import Image from "next/image"
import { CheckCircle2, CreditCard } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { ActivateMembershipForm } from "@/components/admin/activate-membership-form"
import { MembershipDevicesAdmin } from "@/components/admin/membership-devices-admin"
import { Button } from "@/components/ui/button"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  EXTRA_DEVICE_MONTHLY_SOLES,
  FREE_DOWNLOAD_LIMIT,
  MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  planTotalSoles,
} from "@/lib/billing/plans"
import { expireDueMemberships } from "@/lib/billing/membership"
import {
  PROVIDERS,
  providerList,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

import { cancelMembershipAction } from "./actions"

const statusLabel = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
} as const

export default async function SubscriptionsPage() {
  const access = await requirePagePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Membresías" />

  await expireDueMemberships()

  const [users, memberships] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.membership.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        user: { select: { name: true, email: true } },
        devices: {
          orderBy: { lastSeenAt: "desc" },
          select: {
            id: true,
            label: true,
            lastSeenAt: true,
          },
        },
      },
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] px-6 py-7 shadow-[0_20px_50px_-36px_rgba(11,18,32,0.4)] sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-44 rounded-full bg-[var(--mich-blue)]/15 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
              Admin
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-4xl">
              Membresías
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--mich-muted)]">
              Activa planes de Envato o Magnific. 1 dispositivo incluido; +S/{" "}
              {EXTRA_DEVICE_MONTHLY_SOLES}/mes por cada extra. Sin membresía:{" "}
              {FREE_DOWNLOAD_LIMIT} descargas gratis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {providerList().map((p) => (
              <span
                key={p.id}
                className="flex size-11 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-2"
              >
                <Image
                  src={p.logoSrc}
                  alt={p.shortLabel}
                  width={32}
                  height={32}
                  unoptimized
                  className="size-8 object-contain"
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(SUBSCRIPTION_PLANS) as Array<keyof typeof SUBSCRIPTION_PLANS>).map(
          (key) => {
            const plan = SUBSCRIPTION_PLANS[key]
            return (
              <div
                key={key}
                className={cn(
                  "rounded-2xl border bg-[var(--mich-surface)] px-4 py-4",
                  plan.highlight
                    ? "border-[var(--mich-blue)]/45 shadow-[0_12px_30px_-20px_var(--mich-glow)]"
                    : "border-[var(--mich-border)]"
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mich-blue-bright)]">
                  {plan.tagline}
                </p>
                <p className="mt-1 font-heading text-xl font-semibold text-[var(--mich-text)]">
                  {plan.label}
                </p>
                <p className="mt-2 text-sm text-[var(--mich-muted)]">
                  S/ {planTotalSoles(key)} · base S/ {MONTHLY_PRICE_SOLES}/mes
                </p>
                <p className="mt-1 text-xs text-[var(--mich-muted)]">
                  +S/ {EXTRA_DEVICE_MONTHLY_SOLES}/mes por dispositivo extra
                </p>
              </div>
            )
          }
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-6 shadow-[0_16px_40px_-32px_rgba(11,18,32,0.3)]">
          <div className="mb-5 flex items-center gap-2">
            <CreditCard className="size-5 text-[var(--mich-blue)]" />
            <h2 className="font-heading text-lg font-semibold tracking-[-0.03em]">
              Activar membresía
            </h2>
          </div>
          <ActivateMembershipForm users={users} />
        </section>

        <section className="rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-6 shadow-[0_16px_40px_-32px_rgba(11,18,32,0.3)]">
          <h2 className="font-heading mb-4 text-lg font-semibold tracking-[-0.03em]">
            Historial reciente
          </h2>
          <ul className="divide-y divide-[var(--mich-border)]">
            {memberships.length === 0 ? (
              <li className="py-8 text-center text-sm text-[var(--mich-muted)]">
                Aún no hay membresías.
              </li>
            ) : (
              memberships.map((item) => {
                const provider = PROVIDERS[item.provider as ResourceProviderId]
                const active = item.status === "ACTIVE"
                return (
                  <li key={item.id} className="py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-1.5">
                          <Image
                            src={provider?.logoSrc ?? "/envato.png"}
                            alt=""
                            width={28}
                            height={28}
                            unoptimized
                            className="size-7 object-contain"
                          />
                        </span>
                        <div className="min-w-0 space-y-1 text-sm">
                          <p className="font-medium text-[var(--mich-text)]">
                            {item.user.name}{" "}
                            <span className="font-normal text-[var(--mich-muted)]">
                              ({item.user.email})
                            </span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-[var(--mich-muted)]">
                            <span className="font-medium text-[var(--mich-text)]">
                              {provider?.shortLabel ?? item.provider}
                            </span>
                            · {SUBSCRIPTION_PLANS[item.plan].label} · S/{" "}
                            {Number(item.totalPriceSoles)} ·{" "}
                            {item.maxDevices} disp.
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                                active
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-[var(--mich-border)]"
                              )}
                            >
                              {active ? (
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="size-3" />
                                  {statusLabel[item.status]}
                                </span>
                              ) : (
                                statusLabel[item.status]
                              )}
                            </span>
                          </p>
                          <p className="text-xs text-[var(--mich-muted)]">
                            {item.startsAt.toLocaleString("es")} →{" "}
                            {item.endsAt.toLocaleString("es")}
                          </p>
                        </div>
                      </div>
                      {active ? (
                        <form action={cancelMembershipAction}>
                          <input
                            type="hidden"
                            name="membershipId"
                            value={item.id}
                          />
                          <Button type="submit" variant="destructive" size="sm">
                            Cancelar
                          </Button>
                        </form>
                      ) : null}
                    </div>
                    {active ? (
                      <MembershipDevicesAdmin
                        membershipId={item.id}
                        maxDevices={item.maxDevices}
                        devices={item.devices.map((d) => ({
                          id: d.id,
                          label: d.label,
                          lastSeenAt: d.lastSeenAt.toISOString(),
                        }))}
                      />
                    ) : null}
                  </li>
                )
              })
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
