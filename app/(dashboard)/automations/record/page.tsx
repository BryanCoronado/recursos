import { AccessDenied } from "@/components/auth/access-denied"
import { AutomationRecorderPanel } from "@/components/admin/automation-recorder-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export default async function RecordAutomationPage() {
  const access = await requirePagePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Automatizaciones" />

  const recording = await prisma.automationRecording.upsert({
    where: { provider: "ENVATO" },
    update: {},
    create: {
      provider: "ENVATO",
      status: "IDLE",
      steps: [],
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Grabar automatización
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[var(--mich-muted)]">
          Abre la URL de ejemplo (por ejemplo{" "}
          <code>/free-files</code>), haz los clics en el navegador visible y
          guarda la secuencia como regla.
        </p>
      </div>
      <Card className="border-[var(--mich-border)]">
        <CardHeader>
          <CardTitle>Grabadora Envato</CardTitle>
        </CardHeader>
        <CardContent>
          <AutomationRecorderPanel
            initial={{
              status: recording.status,
              name: recording.name,
              sampleUrl: recording.sampleUrl,
              urlPattern: recording.urlPattern,
              nextClickIsDownload: recording.nextClickIsDownload,
              lastError: recording.lastError,
              steps: recording.steps,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
