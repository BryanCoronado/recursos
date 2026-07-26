"use server"

import { compare, hash } from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireUser } from "@/lib/auth/authorization"
import { prisma } from "@/lib/prisma"

export type PasswordActionState = {
  error?: string
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos     8 caracteres"),
    confirmation: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmation, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["confirmation"],
  })

export async function changePassword(
  _state: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const actor = await requireUser({ allowPasswordChange: true })
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true },
  })

  if (!user || !(await compare(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "La contraseña actual no es correcta" }
  }

  if (await compare(parsed.data.newPassword, user.passwordHash)) {
    return { error: "La nueva contraseña debe ser diferente a la actual" }
  }

  const passwordHash = await hash(parsed.data.newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: actor.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: actor.id,
      },
    }),
  ])

  redirect("/dashboard")
}
