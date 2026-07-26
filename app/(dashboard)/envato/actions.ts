"use server"

import { z } from "zod"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { checkEnvatoDownloadAccess } from "@/lib/billing/membership"
import { prisma } from "@/lib/prisma"

export type EnvatoDownloadState = {
  error?: string
  jobId?: string
}

const urlSchema = z
  .string()
  .trim()
  .url("Introduce una URL válida")
  .refine(
    (value) => {
      try {
        const host = new URL(value).hostname.toLowerCase()
        return (
          host === "elements.envato.com" ||
          host.endsWith(".elements.envato.com")
        )
      } catch {
        return false
      }
    },
    { message: "La URL debe ser de elements.envato.com" }
  )

export async function createEnvatoDownloadJob(
  _state: EnvatoDownloadState,
  formData: FormData
): Promise<EnvatoDownloadState> {
  const user = await requirePermission(PERMISSIONS.ENVATO_ACCESS)
  const parsed = urlSchema.safeParse(formData.get("url"))

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "URL inválida" }
  }

  const access = await checkEnvatoDownloadAccess(user.id)
  if (!access.allowed) {
    return { error: access.reason }
  }

  const session = await prisma.providerSession.findUnique({
    where: { provider: "ENVATO" },
  })

  if (!session || session.status !== "READY") {
    return {
      error:
        "Envato no está sincronizado. Pide al administrador que inicie sesión o escríbenos por WhatsApp.",
    }
  }

  const job = await prisma.downloadJob.create({
    data: {
      provider: "ENVATO",
      url: parsed.data,
      status: "QUEUED",
      requestedById: user.id,
    },
  })

  return { jobId: job.id }
}

export async function getEnvatoDownloadJob(jobId: string) {
  const user = await requirePermission(PERMISSIONS.ENVATO_ACCESS)

  const job = await prisma.downloadJob.findFirst({
    where: {
      id: jobId,
      provider: "ENVATO",
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

  return job
}

export type EnvatoHistoryItem = {
  id: string
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED"
  url: string
  fileName: string | null
  error: string | null
  createdAt: string
  finishedAt: string | null
}

export async function listEnvatoDownloadHistory(): Promise<EnvatoHistoryItem[]> {
  const user = await requirePermission(PERMISSIONS.ENVATO_ACCESS)

  const jobs = await prisma.downloadJob.findMany({
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
