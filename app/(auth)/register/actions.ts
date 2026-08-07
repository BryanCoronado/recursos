"use server"

import { hash } from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"

import { buildE164Phone, COUNTRIES } from "@/lib/geo/countries"
import { prisma } from "@/lib/prisma"

export type RegisterActionState = {
  error?: string
}

/** Rol fijo de clientes Envato (prod). También se busca por nombre. */
const CLIENT_ENVATO_ROLE_ID =
  process.env.CLIENT_ENVATO_ROLE_ID ?? "cms22f2n50002i9wgsp8bae7d"
const CLIENT_ENVATO_ROLE_NAME = "Clientes Envato"

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]]

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80),
    email: z.string().trim().toLowerCase().email("Correo inválido"),
    country: z.enum(countryCodes, { message: "Elige tu país" }),
    phone: z
      .string()
      .trim()
      .min(7, "Ingresa un número de celular válido")
      .max(20),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    const e164 = buildE164Phone(data.country, data.phone)
    if (!e164) {
      ctx.addIssue({
        code: "custom",
        message: "Número de celular inválido para ese país",
        path: ["phone"],
      })
    }
  })

async function resolveClientEnvatoRoleId() {
  const byId = await prisma.role.findUnique({
    where: { id: CLIENT_ENVATO_ROLE_ID },
    select: { id: true },
  })
  if (byId) return byId.id

  const byName = await prisma.role.findFirst({
    where: { name: CLIENT_ENVATO_ROLE_NAME },
    select: { id: true },
  })
  return byName?.id ?? null
}

export async function registerClient(
  _state: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    country: formData.get("country"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const phoneE164 = buildE164Phone(parsed.data.country, parsed.data.phone)
  if (!phoneE164) {
    return { error: "Número de celular inválido" }
  }

  const roleId = await resolveClientEnvatoRoleId()
  if (!roleId) {
    return {
      error:
        "No está configurado el rol de clientes Envato. Contacta al administrador.",
    }
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })
  if (exists) {
    return { error: "Ya existe una cuenta con ese correo" }
  }

  const passwordHash = await hash(parsed.data.password, 12)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        country: parsed.data.country,
        phone: phoneE164,
        passwordHash,
        status: "ACTIVE",
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        roles: {
          create: {
            roleId,
          },
        },
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_SELF_REGISTERED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          email: parsed.data.email,
          country: parsed.data.country,
          phone: phoneE164,
          roleId,
          roleName: CLIENT_ENVATO_ROLE_NAME,
        },
      },
    })
  })

  redirect("/login?registered=1")
}
