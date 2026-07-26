import { notFound } from "next/navigation"
import { Trash2 } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { AutomationRuleForm } from "@/components/admin/automation-rule-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

import { deleteAutomationRule, updateAutomationRule } from "../actions"

type AutomationDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function AutomationDetailPage({
  params,
}: AutomationDetailPageProps) {
  const access = await requirePagePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Automatizaciones" />

  const { id } = await params
  const rule = await prisma.automationRule.findUnique({ where: { id } })
  if (!rule) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          {rule.name}
        </h1>
        <p className="mt-2 text-[15px] text-[var(--mich-muted)]">
          Edita selectores CSS o XPath para esta categoría.
        </p>
      </div>
      <Card className="border-[var(--mich-border)]">
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <AutomationRuleForm
            action={updateAutomationRule}
            rule={{
              id: rule.id,
              name: rule.name,
              category: rule.category,
              urlPattern: rule.urlPattern ?? "",
              priority: rule.priority,
              isActive: rule.isActive,
              stepsJson: JSON.stringify(rule.steps, null, 2),
            }}
          />
        </CardContent>
      </Card>
      <form action={deleteAutomationRule}>
        <input type="hidden" name="id" value={rule.id} />
        <Button type="submit" variant="destructive">
          <Trash2 />
          Eliminar regla
        </Button>
      </form>
    </div>
  )
}
