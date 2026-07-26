import Link from "next/link"
import { Plus, Video } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export default async function AutomationsPage() {
  const access = await requirePagePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Automatizaciones" />

  const rules = await prisma.automationRule.findMany({
    where: { provider: "ENVATO" },
    orderBy: [{ category: "asc" }, { priority: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
            Automatizaciones
          </h1>
          <p className="mt-2 text-[15px] text-[var(--mich-muted)]">
            Graba clics en el navegador o edita reglas por ruta (ej.{" "}
            <code>/free-files</code>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/automations/record"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Video />
            Grabar con clics
          </Link>
          <Link href="/automations/new" className={buttonVariants()}>
            <Plus />
            Nueva regla JSON
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((rule) => (
          <Link key={rule.id} href={`/automations/${rule.id}`}>
            <Card className="h-full border-[var(--mich-border)] transition-colors hover:border-[var(--mich-blue)]/40">
              <CardHeader>
                <CardTitle>{rule.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-[var(--mich-muted)]">
                <p>Categoría: {rule.category}</p>
                <p>Patrón: {rule.urlPattern || "—"}</p>
                <p>Prioridad: {rule.priority}</p>
                <p>{rule.isActive ? "Activa" : "Inactiva"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
