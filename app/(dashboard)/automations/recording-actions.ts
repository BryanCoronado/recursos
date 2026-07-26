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
import { prisma } from "@/lib/prisma"

export type RecordingActionState = {
  error?: string
  ok?: boolean
}

const startSchema = z.object({
  name: z.string().trim().min(2).max(80),
  sampleUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => {
      try {
        return new URL(value).hostname.includes("elements.envato.com")
      } catch {
        return false
      }
    }, "Debe ser una URL de elements.envato.com"),
  urlPattern: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(2).max(40).default("default"),
  priority: z.coerce.number().int().min(1).max(999).default(50),
})

async function ensureRecordingRow() {
  return prisma.automationRecording.upsert({
    where: { provider: "ENVATO" },
    update: {},
    create: {
      provider: "ENVATO",
      status: "IDLE",
      steps: [],
    },
  })
}

export async function getAutomationRecording() {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  await ensureRecordingRow()
  return prisma.automationRecording.findUnique({
    where: { provider: "ENVATO" },
  })
}

export async function startAutomationRecording(
  _state: RecordingActionState,
  formData: FormData
): Promise<RecordingActionState> {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)

  const parsed = startSchema.safeParse({
    name: formData.get("name"),
    sampleUrl: formData.get("sampleUrl"),
    urlPattern: formData.get("urlPattern") || undefined,
    category: formData.get("category") || "default",
    priority: formData.get("priority") || 50,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const session = await prisma.providerSession.findUnique({
    where: { provider: "ENVATO" },
  })
  if (!session || session.status !== "READY") {
    return {
      error:
        "Envato debe estar sincronizado (estado Listo) antes de grabar una regla.",
    }
  }

  const urlPattern =
    parsed.data.urlPattern?.trim() ||
    extractUrlPattern(parsed.data.sampleUrl)

  await ensureRecordingRow()
  await prisma.automationRecording.update({
    where: { provider: "ENVATO" },
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

export async function markNextClickAsDownload() {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  await prisma.automationRecording.update({
    where: { provider: "ENVATO" },
    data: { nextClickIsDownload: true, lastError: null },
  })
  revalidatePath("/automations/record")
}

export async function stopAutomationRecording() {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  await prisma.automationRecording.update({
    where: { provider: "ENVATO" },
    data: { status: "STOPPED", nextClickIsDownload: false },
  })
  revalidatePath("/automations/record")
}

export async function cancelAutomationRecording() {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  await prisma.automationRecording.update({
    where: { provider: "ENVATO" },
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

export async function saveRecordingAsRule(): Promise<RecordingActionState> {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)

  const recording = await prisma.automationRecording.findUnique({
    where: { provider: "ENVATO" },
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
      provider: "ENVATO",
      name: recording.name,
      category: recording.category,
      urlPattern: recording.urlPattern,
      priority: recording.priority,
      isActive: true,
      steps,
    },
  })

  await prisma.automationRecording.update({
    where: { provider: "ENVATO" },
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
