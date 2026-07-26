import "server-only"

import { PrismaMariaDb } from "@prisma/adapter-mariadb"

import { PrismaClient } from "@/lib/generated/prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada")
}

const createPrismaClient = () => {
  const adapter = new PrismaMariaDb(connectionString)
  return new PrismaClient({ adapter })
}

type AppPrismaClient = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient | undefined
}

function isClientCurrent(client: AppPrismaClient | undefined) {
  return Boolean(
    client?.providerSession &&
      client?.automationRecording &&
      client?.downloadJob &&
      client?.automationRule
  )
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma
  if (isClientCurrent(existing)) {
    return existing as AppPrismaClient
  }

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
  }
  return client
}

/** Proxy: en HMR recrea el cliente si faltan modelos nuevos. */
export const prisma = new Proxy({} as AppPrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
})
