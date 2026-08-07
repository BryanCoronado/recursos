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
  cancelMagnificDownloadJob,
  createMagnificDownloadJob,
  getMagnificDownloadJob,
  listMagnificDownloadHistory,
} from "./actions"

export default async function MagnificPage() {
  const access = await requirePagePermission(PERMISSIONS.MAGNIFIC_ACCESS)
  if (!access.allowed || !access.user) {
    return <AccessDenied moduleName="Magnific" />
  }

  const user = access.user
  const freeCtx = await freeDownloadContextFromRequest()
  const [session, jobs, quota, membership] = await Promise.all([
    prisma.providerSession.findUnique({
      where: { provider: "MAGNIFIC" },
      select: { status: true },
    }),
    prisma.downloadJob.findMany({
      where: {
        provider: "MAGNIFIC",
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
    checkProviderDownloadAccess(user.id, "MAGNIFIC", freeCtx),
    getActiveMembership(user.id, "MAGNIFIC"),
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
        "MAGNIFIC",
        membership.maxDevices
      )
    : undefined

  return (
    <DeviceGate provider="MAGNIFIC" upgradeWhatsAppUrl={upgradeUrl}>
      <ProviderDownloadForm
        provider="MAGNIFIC"
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
        createJob={createMagnificDownloadJob}
        getJob={getMagnificDownloadJob}
        listHistory={listMagnificDownloadHistory}
        cancelJob={cancelMagnificDownloadJob}
        help={{
          browseUrl: "https://www.magnific.com/",
          browseLabel: "Abrir Magnific",
        }}
      />
    </DeviceGate>
  )
}
