import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { hash } from "bcryptjs"
import { config } from "dotenv"

import { PrismaClient } from "../lib/generated/prisma/client"
import { DEFAULT_ENVATO_STEPS } from "../lib/automation/types"
import { PERMISSION_DEFINITIONS } from "../lib/auth/permissions"
import { providerProfilePath } from "../lib/storage/paths"

config({ path: ".env" })
config({ path: ".env.local", override: true })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada")
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(connectionString),
})

async function main() {
  const legacyFreepik = await prisma.permission.findUnique({
    where: { key: "freepik:access" },
    select: { id: true },
  })

  if (legacyFreepik) {
    await prisma.permission.update({
      where: { id: legacyFreepik.id },
      data: {
        key: "magnific:access",
        module: "magnific",
        action: "access",
        label: "Acceder a Magnific",
      },
    })
  }

  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: permission,
      create: permission,
    })
  }

  const superAdminRole = await prisma.role.upsert({
    where: { systemKey: "SUPER_ADMIN" },
    update: {
      name: "Superadministrador",
      description: "Acceso total y rol raíz protegido",
      isSystem: true,
    },
    create: {
      name: "Superadministrador",
      description: "Acceso total y rol raíz protegido",
      systemKey: "SUPER_ADMIN",
      isSystem: true,
    },
  })

  const permissions = await prisma.permission.findMany({
    select: { id: true },
  })

  await prisma.rolePermission.createMany({
    data: permissions.map(({ id }) => ({
      roleId: superAdminRole.id,
      permissionId: id,
    })),
    skipDuplicates: true,
  })

  await prisma.providerSession.upsert({
    where: { provider: "ENVATO" },
    update: {},
    create: {
      provider: "ENVATO",
      status: "DISCONNECTED",
      profilePath: providerProfilePath("envato"),
    },
  })

  await prisma.automationRecording.upsert({
    where: { provider: "ENVATO" },
    update: {},
    create: {
      provider: "ENVATO",
      status: "IDLE",
      steps: [],
    },
  })

  const existingDefaultRule = await prisma.automationRule.findFirst({
    where: {
      provider: "ENVATO",
      category: "default",
      name: "Envato Elements genérico",
    },
  })

  if (!existingDefaultRule) {
    await prisma.automationRule.create({
      data: {
        provider: "ENVATO",
        category: "default",
        name: "Envato Elements genérico",
        priority: 100,
        isActive: true,
        steps: DEFAULT_ENVATO_STEPS,
      },
    })
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrador"

  if (!email || !password) {
    console.warn(
      "Permisos y reglas creados. Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD para crear el administrador inicial."
    )
    return
  }

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 8 caracteres")
  }

  const passwordHash = await hash(password, 12)
  const admin = await prisma.user.upsert({
    where: { email },
    update: { status: "ACTIVE" },
    create: {
      email,
      name,
      passwordHash,
      status: "ACTIVE",
      mustChangePassword: true,
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: superAdminRole.id,
      assignedBy: admin.id,
    },
  })

  console.info(`Administrador inicial preparado: ${email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
