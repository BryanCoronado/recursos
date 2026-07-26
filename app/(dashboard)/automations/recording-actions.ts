"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  ensureDownloadStep,
  extractUrlPattern,
} from "@/lib/automation/match"
import { automationStepsSchema } from "@/lib/automation/types"
import {
  getProvider,
  isUrlForProvider,
  requireProviderId,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

export type RecordingActionState = {
  error?: string
  ok?: boolean
}

const startSchema = z.object({
  provider: z.string(),
  name: z.string().trim().min(2).max(80),
  sampleUrl: z.string().trim().url(),
  urlPattern: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(2).max(40).default("default"),
  priority: z.coerce.number().int().min(1).max(999).default(50),
})

async function ensureRecordingRow(provider: ResourceProviderId) {
  return prisma.automationRecording.upsert({
    where: { provider },
    update: {},
    create: {
      provider,
      status: "IDLE",
      steps: [],
    },
  })
}

export async function getAutomationRecording(providerRaw?: string | null) {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  const provider = requireProviderId(providerRaw ?? "ENVATO")
  await ensureRecordingRow(provider)
  return prisma.automationRecording.findUnique({
    where: { provider },
  })
}

export async function startAutomationRecording(
  _state: RecordingActionState,
  formData: FormData
): Promise<RecordingActionState> {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)

  const parsed = startSchema.safeParse({
    provider: formData.get("provider"),
    name: formData.get("name"),
    sampleUrl: formData.get("sampleUrl"),
    urlPattern: formData.get("urlPattern") || undefined,
    category: formData.get("category") || "default",
    priority: formData.get("priority") || 50,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  let provider: ResourceProviderId
  try {
    provider = requireProviderId(parsed.data.provider)
  } catch {
    return { error: "Elige un proveedor válido" }
  }

  const def = getProvider(provider)
  if (!isUrlForProvider(provider, parsed.data.sampleUrl)) {
    return {
      error: `La URL debe ser de ${def.hosts.join(" / ")}`,
    }
  }

  const session = await prisma.providerSession.findUnique({
    where: { provider },
  })
  if (!session || session.status !== "READY") {
    return {
      error: `${def.shortLabel} debe estar sincronizado (Listo) antes de grabar.`,
    }
  }

  const urlPattern =
    parsed.data.urlPattern?.trim() ||
    extractUrlPattern(parsed.data.sampleUrl)

  await ensureRecordingRow(provider)
  await prisma.automationRecording.update({
    where: { provider },
    data: {
      status: "RECORDING",
      name: parsed.data.name,
      sampleUrl: parsed.data.sampleUrl,
      urlPattern,
      category: parsed.data.category,
      priority: parsed.data.priority,
      steps: [],
      nextClickIsDownload: false,
      recordToken: randomUUID(),
      lastError: null,
    },
  })

  revalidatePath("/automations")
  revalidatePath("/automations/record")
  return { ok: true }
}

export async function markNextClickAsDownload(formData?: FormData) {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  const provider = requireProviderId(formData?.get("provider") ?? "ENVATO")
  await prisma.automationRecording.update({
    where: { provider },
    data: { nextClickIsDownload: true, lastError: null },
  })
  revalidatePath("/automations/record")
}

export async function stopAutomationRecording(formData?: FormData) {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  const provider = requireProviderId(formData?.get("provider") ?? "ENVATO")
  await prisma.automationRecording.update({
    where: { provider },
    data: { status: "STOPPED", nextClickIsDownload: false },
  })
  revalidatePath("/automations/record")
}

export async function cancelAutomationRecording(formData?: FormData) {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  const provider = requireProviderId(formData?.get("provider") ?? "ENVATO")
  await prisma.automationRecording.update({
    where: { provider },
    data: {
      status: "IDLE",
      steps: [],
      nextClickIsDownload: false,
      recordToken: null,
      lastError: null,
    },
  })
  revalidatePath("/automations")
  revalidatePath("/automations/record")
}

export async function saveRecordingAsRule(
  formData?: FormData
): Promise<RecordingActionState> {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  const provider = requireProviderId(formData?.get("provider") ?? "ENVATO")

  const recording = await prisma.automationRecording.findUnique({
    where: { provider },
  })

  if (!recording?.name || !recording.urlPattern) {
    return { error: "No hay grabación para guardar" }
  }

  const parsed = automationStepsSchema.safeParse(recording.steps)
  if (!parsed.success || parsed.data.length === 0) {
    return { error: "Graba al menos un clic antes de guardar" }
  }

  const steps = ensureDownloadStep(parsed.data)

  const rule = await prisma.automationRule.create({
    data: {
      provider,
      name: recording.name,
      category: recording.category,
      urlPattern: recording.urlPattern,
      priority: recording.priority,
      isActive: true,
      steps,
    },
  })

  await prisma.automationRecording.update({
    where: { provider },
    data: {
      status: "IDLE",
      steps: [],
      nextClickIsDownload: false,
      recordToken: null,
      lastError: null,
    },
  })

  redirect(`/automations/${rule.id}`)
}
