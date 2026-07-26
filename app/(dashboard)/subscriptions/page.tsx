import { AccessDenied } from "@/components/auth/access-denied"
import { ActivateMembershipForm } from "@/components/admin/activate-membership-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { ENVATO_MONTHLY_PRICE_SOLES, SUBSCRIPTION_PLANS, planTotalSoles } from "@/lib/billing/envato"
import { expireDueMemberships } from "@/lib/billing/membership"
import { prisma } from "@/lib/prisma"

import { cancelMembershipAction } from "./actions"

const statusLabel = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
} as const

export default async function SubscriptionsPage() {
  const access = await requirePagePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Membresías" />

  await expireDueMemberships("ENVATO")

  const [users, memberships] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.membership.findMany({
      where: { provider: "ENVATO" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Membresías Envato
        </h1>
        <p className="mt-2 text-[15px] text-[var(--mich-muted)]">
          S/ {ENVATO_MONTHLY_PRICE_SOLES}/mes. Sin membresía el cliente tiene 2
          descargas gratis; con membresía activa, ilimitadas hasta la fecha de
          fin (o cancelación manual).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[var(--mich-border)]">
          <CardHeader>
            <CardTitle>Activar membresía</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivateMembershipForm users={users} />
          </CardContent>
        </Card>

        <Card className="border-[var(--mich-border)]">
          <CardHeader>
            <CardTitle>Planes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--mich-muted)]">
            {(Object.keys(SUBSCRIPTION_PLANS) as Array<keyof typeof SUBSCRIPTION_PLANS>).map(
              (key) => {
                const plan = SUBSCRIPTION_PLANS[key]
                return (
                  <p key={key}>
                    {plan.label}: S/ {planTotalSoles(key)}
                    {plan.totalSoles < ENVATO_MONTHLY_PRICE_SOLES * plan.months
                      ? ` (ahorro vs S/ ${ENVATO_MONTHLY_PRICE_SOLES * plan.months})`
                      : ""}
                  </p>
                )
              }
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--mich-border)]">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-[var(--mich-border)]">
            {memberships.length === 0 ? (
              <li className="py-6 text-sm text-[var(--mich-muted)]">
                Aún no hay membresías.
              </li>
            ) : (
              memberships.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-[var(--mich-text)]">
                      {item.user.name}{" "}
                      <span className="text-[var(--mich-muted)]">
                        ({item.user.email})
                      </span>
                    </p>
                    <p className="text-[var(--mich-muted)]">
                      {SUBSCRIPTION_PLANS[item.plan].label} ·{" "}
                      {statusLabel[item.status]} · S/{" "}
                      {Number(item.totalPriceSoles)}
                    </p>
                    <p className="text-xs text-[var(--mich-muted)]">
                      {item.startsAt.toLocaleString("es")} →{" "}
                      {item.endsAt.toLocaleString("es")}
                    </p>
                  </div>
                  {item.status === "ACTIVE" ? (
                    <form action={cancelMembershipAction}>
                      <input type="hidden" name="membershipId" value={item.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Cancelar ahora
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
