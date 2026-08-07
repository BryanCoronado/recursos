import Link from "next/link"
import { Plus, Video } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { PROVIDERS, type ResourceProviderId } from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export default async function AutomationsPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const access = await requirePagePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Automatizaciones" />

  const params = await searchParams
  const providerFilter =
    params.provider === "ENVATO" || params.provider === "MAGNIFIC"
      ? (params.provider as ResourceProviderId)
      : undefined

  const rules = await prisma.automationRule.findMany({
    where: providerFilter ? { provider: providerFilter } : undefined,
    orderBy: [{ provider: "asc" }, { category: "asc" }, { priority: "asc" }],
  })

  return (
    <div className="space-y-8">
      <div className="mich-page-card relative flex flex-wrap items-start justify-between gap-4 px-6 py-7 sm:px-8">
        <div className="relative z-10">
          <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
            Flujos
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)]">
            Automatizaciones
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-[var(--mich-muted)]">
            Flujos por proveedor. Graba clics o edita reglas JSON.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          <Link
            href={
              providerFilter
                ? `/automations/record?provider=${providerFilter}`
                : "/automations/record"
            }
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Video />
            Grabar con clics
          </Link>
          <Link
            href={
              providerFilter
                ? `/automations/new?provider=${providerFilter}`
                : "/automations/new"
            }
            className={buttonVariants()}
          >
            <Plus />
            Nueva regla JSON
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <FilterChip href="/automations" active={!providerFilter} label="Todos" />
        <FilterChip
          href="/automations?provider=ENVATO"
          active={providerFilter === "ENVATO"}
          label="Envato"
        />
        <FilterChip
          href="/automations?provider=MAGNIFIC"
          active={providerFilter === "MAGNIFIC"}
          label="Magnific"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((rule) => (
          <Link key={rule.id} href={`/automations/${rule.id}`}>
            <Card className="h-full border-[var(--mich-border)] bg-[var(--mich-surface)] shadow-[0_14px_36px_-30px_rgba(11,18,32,0.35)] transition-all hover:-translate-y-0.5 hover:border-[var(--mich-blue)]/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{rule.name}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      rule.isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-[var(--mich-border)] text-[var(--mich-muted)]"
                    )}
                  >
                    {PROVIDERS[rule.provider as ResourceProviderId]?.shortLabel ??
                      rule.provider}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-[var(--mich-muted)]">
                <p>Categoría: {rule.category}</p>
                <p>Patrón: {rule.urlPattern || "—"}</p>
                <p>Prioridad: {rule.priority}</p>
                <p className="pt-1 font-medium text-[var(--mich-text)]">
                  {rule.isActive ? "● Activa" : "○ Inactiva"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {rules.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--mich-border)] px-4 py-10 text-center text-sm text-[var(--mich-muted)] md:col-span-2">
            No hay reglas
            {providerFilter
              ? ` para ${PROVIDERS[providerFilter].shortLabel}`
              : ""}
            .
          </p>
        ) : null}
      </div>
    </div>
  )
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 transition-colors",
        active
          ? "border-[var(--mich-blue)]/50 bg-[var(--mich-blue)]/10 text-[var(--mich-text)]"
          : "border-[var(--mich-border)] text-[var(--mich-muted)] hover:border-[var(--mich-blue)]/35"
      )}
    >
      {label}
    </Link>
  )
}
