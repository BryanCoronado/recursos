import { AccessDenied } from "@/components/auth/access-denied"
import { AutomationRuleForm } from "@/components/admin/automation-rule-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  isResourceProviderId,
  type ResourceProviderId,
} from "@/lib/providers/catalog"

import { createAutomationRule } from "../actions"

export default async function NewAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const access = await requirePagePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Automatizaciones" />

  const params = await searchParams
  const defaultProvider: ResourceProviderId =
    params.provider && isResourceProviderId(params.provider)
      ? params.provider
      : "ENVATO"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Nueva automatización
        </h1>
        <p className="mt-2 text-[15px] text-[var(--mich-muted)]">
          Elige el proveedor y los pasos que Playwright ejecutará al descargar.
        </p>
      </div>
      <Card className="border-[var(--mich-border)]">
        <CardHeader>
          <CardTitle>Nueva regla</CardTitle>
        </CardHeader>
        <CardContent>
          <AutomationRuleForm
            action={createAutomationRule}
            showProviderSelect
            defaultProvider={defaultProvider}
          />
        </CardContent>
      </Card>
    </div>
  )
}
