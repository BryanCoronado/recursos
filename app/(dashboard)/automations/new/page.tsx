import { AccessDenied } from "@/components/auth/access-denied"
import { AutomationRuleForm } from "@/components/admin/automation-rule-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"

import { createAutomationRule } from "../actions"

export default async function NewAutomationPage() {
  const access = await requirePagePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Automatizaciones" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Nueva automatización
        </h1>
        <p className="mt-2 text-[15px] text-[var(--mich-muted)]">
          Configura los pasos que Playwright ejecutará al descargar.
        </p>
      </div>
      <Card className="border-[var(--mich-border)]">
        <CardHeader>
          <CardTitle>Regla Envato</CardTitle>
        </CardHeader>
        <CardContent>
          <AutomationRuleForm action={createAutomationRule} />
        </CardContent>
      </Card>
    </div>
  )
}
