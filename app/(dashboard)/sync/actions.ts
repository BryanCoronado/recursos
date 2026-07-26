"use server"

import { revalidatePath } from "next/cache"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { providerProfilePath } from "@/lib/storage/paths"

export async function startEnvatoSync() {
  await requirePermission(PERMISSIONS.SYNC_ACCESS)

  await prisma.providerSession.upsert({
    where: { provider: "ENVATO" },
    update: {
      status: "SYNCING",
      profilePath: providerProfilePath("envato"),
      lastError: null,
    },
    create: {
      provider: "ENVATO",
      status: "SYNCING",
      profilePath: providerProfilePath("envato"),
    },
  })

  revalidatePath("/sync")
}

export async function markEnvatoSynced() {
  await requirePermission(PERMISSIONS.SYNC_ACCESS)

  await prisma.providerSession.upsert({
    where: { provider: "ENVATO" },
    update: {
      status: "READY",
      lastSyncedAt: new Date(),
      lastError: null,
      profilePath: providerProfilePath("envato"),
    },
    create: {
      provider: "ENVATO",
      status: "READY",
      lastSyncedAt: new Date(),
      profilePath: providerProfilePath("envato"),
    },
  })

  revalidatePath("/sync")
  revalidatePath("/envato")
}

export async function disconnectEnvato() {
  await requirePermission(PERMISSIONS.SYNC_ACCESS)

  await prisma.providerSession.upsert({
    where: { provider: "ENVATO" },
    update: {
      status: "DISCONNECTED",
      lastError: null,
      profilePath: providerProfilePath("envato"),
    },
    create: {
      provider: "ENVATO",
      status: "DISCONNECTED",
      profilePath: providerProfilePath("envato"),
    },
  })

  revalidatePath("/sync")
  revalidatePath("/envato")
}
