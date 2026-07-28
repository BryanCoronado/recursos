import { AccessDenied } from "@/components/auth/access-denied"
import { DeviceGate } from "@/components/billing/device-gate"
import { ProviderDownloadForm } from "@/components/resources/provider-download-form"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { whatsappExtraDeviceUrl } from "@/lib/billing/plans"
import {
  checkProviderDownloadAccess,
  getActiveMembership,
} from "@/lib/billing/membership"
import { freeDownloadContextFromRequest } from "@/lib/billing/free-download-context"
import { prisma } from "@/lib/prisma"

import {
  cancelEnvatoDownloadJob,
  createEnvatoDownloadJob,
  getEnvatoDownloadJob,
  listEnvatoDownloadHistory,
} from "./actions"

export default async function EnvatoPage() {
  const access = await requirePagePermission(PERMISSIONS.ENVATO_ACCESS)
  if (!access.allowed || !access.user) {
    return <AccessDenied moduleName="Envato" />
  }

  const user = access.user
  const freeCtx = await freeDownloadContextFromRequest()
  const [session, jobs, quota, membership] = await Promise.all([
    prisma.providerSession.findUnique({
      where: { provider: "ENVATO" },
      select: { status: true },
    }),
    prisma.downloadJob.findMany({
      where: {
        provider: "ENVATO",
        requestedById: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        url: true,
        fileName: true,
        error: true,
        logs: true,
        createdAt: true,
        finishedAt: true,
      },
    }),
    checkProviderDownloadAccess(user.id, "ENVATO", freeCtx),
    getActiveMembership(user.id, "ENVATO"),
  ])

  const quotaForClient =
    quota.unlimited === true
      ? {
          allowed: true as const,
          unlimited: true as const,
          membershipEndsAt: quota.membershipEndsAt.toISOString(),
        }
      : quota

  const upgradeUrl = membership
    ? whatsappExtraDeviceUrl(
        user.name,
        user.email,
        "ENVATO",
        membership.maxDevices
      )
    : undefined

  return (
    <DeviceGate provider="ENVATO" upgradeWhatsAppUrl={upgradeUrl}>
      <ProviderDownloadForm
        provider="ENVATO"
        sessionReady={session?.status === "READY"}
        quota={quotaForClient}
        initialHistory={jobs.map((job) => ({
          id: job.id,
          status: job.status,
          url: job.url,
          fileName: job.fileName,
          error: job.error,
          logs: job.logs,
          createdAt: job.createdAt.toISOString(),
          finishedAt: job.finishedAt?.toISOString() ?? null,
        }))}
        createJob={createEnvatoDownloadJob}
        getJob={getEnvatoDownloadJob}
        listHistory={listEnvatoDownloadHistory}
        cancelJob={cancelEnvatoDownloadJob}
        help={{
          tutorialYoutubeUrl: "https://youtu.be/7Gjz5ax5J9U",
          browseUrl: "https://elements.envato.com/es/",
          browseLabel: "Abrir Elements",
        }}
      />
    </DeviceGate>
  )
}
