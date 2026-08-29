import { AccessDenied } from "@/components/auth/access-denied"
import { AutomationRecorderPanel } from "@/components/admin/automation-recorder-panel"
import { NovncPanel } from "@/components/worker/novnc-panel"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { getNovncViewerUrl } from "@/lib/novnc"
import {
  isResourceProviderId,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

export default async function RecordAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const access = await requirePagePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  if (!access.allowed) return <AccessDenied moduleName="Automatizaciones" />

  const params = await searchParams
  const provider: ResourceProviderId =
    params.provider && isResourceProviderId(params.provider)
      ? params.provider
      : "ENVATO"

  const recording = await prisma.automationRecording.upsert({
    where: { provider },
    update: {},
    create: {
      provider,
      status: "IDLE",
      steps: [],
    },
  })

  const isRecording = recording.status === "RECORDING"
  const novncUrl = getNovncViewerUrl()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Grabar automatización
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[var(--mich-muted)]">
          Elige proveedor, abre el escritorio del worker abajo (iframe) y graba
          los clics. Puedes maximizar o minimizar el panel.
        </p>
      </div>

      <NovncPanel
        viewerUrl={novncUrl}
        autoOpen={isRecording}
        title="Escritorio del worker (grabación)"
      />

      <section className="mich-soft-card p-5 sm:p-6">
        <h2 className="font-heading mb-4 text-lg font-semibold tracking-[-0.03em]">
          Controles de grabación
        </h2>
        <AutomationRecorderPanel
          key={provider}
          provider={provider}
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
      </section>
    </div>
  )
}
