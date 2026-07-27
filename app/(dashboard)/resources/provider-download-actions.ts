"use server"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { checkProviderDownloadAccess } from "@/lib/billing/membership"
import {
  getProvider,
  isUrlForProvider,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

export type ProviderDownloadState = {
  error?: string
  jobId?: string
}

export type ProviderHistoryItem = {
  id: string
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED"
  url: string
  fileName: string | null
  error: string | null
  createdAt: string
  finishedAt: string | null
}

const ACCESS_PERMISSION = {
  ENVATO: PERMISSIONS.ENVATO_ACCESS,
  MAGNIFIC: PERMISSIONS.MAGNIFIC_ACCESS,
} as const

export async function createProviderDownloadJob(
  provider: ResourceProviderId,
  _state: ProviderDownloadState,
  formData: FormData
): Promise<ProviderDownloadState> {
  const user = await requirePermission(ACCESS_PERMISSION[provider])
  const def = getProvider(provider)
  const rawUrl = formData.get("url")

  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { error: "Introduce una URL válida" }
  }

  let url: string
  try {
    url = new URL(rawUrl.trim()).toString()
  } catch {
    return { error: "Introduce una URL válida" }
  }

  if (!isUrlForProvider(provider, url)) {
    return {
      error: `La URL debe ser de ${def.hosts.join(" / ")}`,
    }
  }

  const access = await checkProviderDownloadAccess(user.id, provider)
  if (!access.allowed) {
    return { error: access.reason }
  }

  const session = await prisma.providerSession.findUnique({
    where: { provider },
  })

  if (!session || session.status !== "READY") {
    return {
      error: `${def.shortLabel} no está sincronizado. Pide al administrador que inicie sesión o escríbenos por WhatsApp.`,
    }
  }

  const job = await prisma.downloadJob.create({
    data: {
      provider,
      url,
      status: "QUEUED",
      requestedById: user.id,
    },
  })

  return { jobId: job.id }
}

export async function getProviderDownloadJob(
  provider: ResourceProviderId,
  jobId: string
) {
  const user = await requirePermission(ACCESS_PERMISSION[provider])

  return prisma.downloadJob.findFirst({
    where: {
      id: jobId,
      provider,
      requestedById: user.id,
    },
    select: {
      id: true,
      status: true,
      url: true,
      fileName: true,
      error: true,
      createdAt: true,
      finishedAt: true,
    },
  })
}

export async function listProviderDownloadHistory(
  provider: ResourceProviderId
): Promise<ProviderHistoryItem[]> {
  const user = await requirePermission(ACCESS_PERMISSION[provider])

  const jobs = await prisma.downloadJob.findMany({
    where: {
      provider,
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
      createdAt: true,
      finishedAt: true,
    },
  })

  return jobs.map((job) => ({
    id: job.id,
    status: job.status,
    url: job.url,
    fileName: job.fileName,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
  }))
}
