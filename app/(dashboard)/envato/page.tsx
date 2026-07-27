import { AccessDenied } from "@/components/auth/access-denied"
import { ProviderDownloadForm } from "@/components/resources/provider-download-form"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { checkProviderDownloadAccess } from "@/lib/billing/membership"
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

  const [session, jobs, quota] = await Promise.all([
    prisma.providerSession.findUnique({
      where: { provider: "ENVATO" },
      select: { status: true },
    }),
    prisma.downloadJob.findMany({
      where: {
        provider: "ENVATO",
        requestedById: access.user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        url: true,
        fileName: true,
        error: true,
        createdAt: true,
        finishedAt: true,
      },
    }),
    checkProviderDownloadAccess(access.user.id, "ENVATO"),
  ])

  const quotaForClient =
    quota.unlimited === true
      ? {
          allowed: true as const,
          unlimited: true as const,
          membershipEndsAt: quota.membershipEndsAt.toISOString(),
        }
      : quota

  return (
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
        createdAt: job.createdAt.toISOString(),
        finishedAt: job.finishedAt?.toISOString() ?? null,
      }))}
      createJob={createEnvatoDownloadJob}
      getJob={getEnvatoDownloadJob}
      listHistory={listEnvatoDownloadHistory}
      cancelJob={cancelEnvatoDownloadJob}
    />
  )
}
