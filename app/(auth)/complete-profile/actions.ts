"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { requireUser } from "@/lib/auth/authorization"
import { resolveHomePath } from "@/lib/auth/home-path"
import { buildE164Phone, COUNTRIES } from "@/lib/geo/countries"
import { prisma } from "@/lib/prisma"

export type CompleteProfileState = {
  error?: string
}

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]]

const schema = z
  .object({
    country: z.enum(countryCodes, { message: "Elige tu país" }),
    phone: z
      .string()
      .trim()
      .min(7, "Ingresa un número de celular válido")
      .max(20),
  })
  .superRefine((data, ctx) => {
    if (!buildE164Phone(data.country, data.phone)) {
      ctx.addIssue({
        code: "custom",
        message: "Número de celular inválido para ese país",
        path: ["phone"],
      })
    }
  })

export async function completeProfile(
  _state: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const user = await requireUser({ allowIncompleteProfile: true })

  const parsed = schema.safeParse({
    country: formData.get("country"),
    phone: formData.get("phone"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const phoneE164 = buildE164Phone(parsed.data.country, parsed.data.phone)
  if (!phoneE164) {
    return { error: "Número de celular inválido" }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      country: parsed.data.country,
      phone: phoneE164,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "USER_PROFILE_COMPLETED",
      entityType: "User",
      entityId: user.id,
      metadata: {
        country: parsed.data.country,
        phone: phoneE164,
      },
    },
  })

  // Re-fetch permissions from current user object
  redirect(resolveHomePath(user.permissions))
}
