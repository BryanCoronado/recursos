import "server-only"

import { PrismaMariaDb } from "@prisma/adapter-mariadb"

import { PrismaClient } from "@/lib/generated/prisma/client"
import { createMariaDbAdapter } from "@/lib/prisma-adapter"

const createPrismaClient = () => {
  return new PrismaClient({ adapter: createMariaDbAdapter(5) })
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
      client?.automationRule &&
      client?.membership
  )
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma
  if (isClientCurrent(existing)) {
    return existing as AppPrismaClient
  }

  const client = createPrismaClient()
  // Importante: también en producción. Sin esto cada acceso abría un pool nuevo
  // y MySQL llegaba a "Too many connections".
  globalForPrisma.prisma = client
  return client
}

export const prisma = new Proxy({} as AppPrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
})
