import { AccessDenied } from "@/components/auth/access-denied"
import { EnvatoDownloadForm } from "@/components/resources/envato-download-form"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export default async function EnvatoPage() {
  const access = await requirePagePermission(PERMISSIONS.ENVATO_ACCESS)
  if (!access.allowed || !access.user) {
    return <AccessDenied moduleName="Envato" />
  }

  const [session, jobs] = await Promise.all([
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
  ])

  return (
    <EnvatoDownloadForm
      sessionReady={session?.status === "READY"}
      initialHistory={jobs.map((job) => ({
        id: job.id,
        status: job.status,
        url: job.url,
        fileName: job.fileName,
        error: job.error,
        createdAt: job.createdAt.toISOString(),
        finishedAt: job.finishedAt?.toISOString() ?? null,
      }))}
    />
  )
}
