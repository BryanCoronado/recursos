"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { automationStepsSchema } from "@/lib/automation/types"
import { prisma } from "@/lib/prisma"

export type AutomationActionState = {
  error?: string
}

const ruleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40),
  urlPattern: z.string().trim().max(120).optional(),
  priority: z.coerce.number().int().min(1).max(999),
  isActive: z.boolean(),
  stepsJson: z.string().min(2),
})

function parseSteps(raw: string) {
  const parsedJson = JSON.parse(raw) as unknown
  return automationStepsSchema.parse(parsedJson)
}

export async function createAutomationRule(
  _state: AutomationActionState,
  formData: FormData
): Promise<AutomationActionState> {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)

  const parsed = ruleSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    urlPattern: String(formData.get("urlPattern") ?? "").trim() || undefined,
    priority: formData.get("priority"),
    isActive: formData.get("isActive") === "on",
    stepsJson: formData.get("stepsJson"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  let ruleId: string
  try {
    const steps = parseSteps(parsed.data.stepsJson)
    const rule = await prisma.automationRule.create({
      data: {
        provider: "ENVATO",
        name: parsed.data.name,
        category: parsed.data.category,
        urlPattern: parsed.data.urlPattern ?? null,
        priority: parsed.data.priority,
        isActive: parsed.data.isActive,
        steps,
      },
    })
    ruleId = rule.id
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: "El JSON de pasos no es válido" }
    }
    return {
      error: error instanceof Error ? error.message : "No se pudo crear la regla",
    }
  }

  redirect(`/automations/${ruleId}`)
}

export async function updateAutomationRule(
  _state: AutomationActionState,
  formData: FormData
): Promise<AutomationActionState> {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  const id = String(formData.get("id") ?? "")

  const parsed = ruleSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    urlPattern: String(formData.get("urlPattern") ?? "").trim() || undefined,
    priority: formData.get("priority"),
    isActive: formData.get("isActive") === "on",
    stepsJson: formData.get("stepsJson"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const steps = parseSteps(parsed.data.stepsJson)
    await prisma.automationRule.update({
      where: { id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        urlPattern: parsed.data.urlPattern ?? null,
        priority: parsed.data.priority,
        isActive: parsed.data.isActive,
        steps,
      },
    })
    revalidatePath("/automations")
    revalidatePath(`/automations/${id}`)
    return {}
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: "El JSON de pasos no es válido" }
    }
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar",
    }
  }
}

export async function deleteAutomationRule(formData: FormData) {
  await requirePermission(PERMISSIONS.AUTOMATIONS_MANAGE)
  const id = String(formData.get("id") ?? "")
  await prisma.automationRule.delete({ where: { id } })
  redirect("/automations")
}
