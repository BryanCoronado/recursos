"use server"

import { revalidatePath } from "next/cache"

import { requirePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  getProvider,
  requireProviderId,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"
import { providerProfilePath } from "@/lib/storage/paths"

function revalidateProviderPaths(provider: ResourceProviderId) {
  const def = getProvider(provider)
  revalidatePath("/sync")
  revalidatePath(def.dashboardPath)
  revalidatePath("/automations")
}

export async function startProviderSync(formData: FormData) {
  await requirePermission(PERMISSIONS.SYNC_ACCESS)
  const provider = requireProviderId(formData.get("provider"))
  const def = getProvider(provider)

  await prisma.providerSession.upsert({
    where: { provider },
    update: {
      status: "SYNCING",
      profilePath: providerProfilePath(def.slug),
      lastError: null,
    },
    create: {
      provider,
      status: "SYNCING",
      profilePath: providerProfilePath(def.slug),
    },
  })

  revalidateProviderPaths(provider)
}

export async function markProviderSynced(formData: FormData) {
  await requirePermission(PERMISSIONS.SYNC_ACCESS)
  const provider = requireProviderId(formData.get("provider"))
  const def = getProvider(provider)

  await prisma.providerSession.upsert({
    where: { provider },
    update: {
      status: "READY",
      lastSyncedAt: new Date(),
      lastError: null,
      profilePath: providerProfilePath(def.slug),
    },
    create: {
      provider,
      status: "READY",
      lastSyncedAt: new Date(),
      profilePath: providerProfilePath(def.slug),
    },
  })

  revalidateProviderPaths(provider)
}

export async function disconnectProvider(formData: FormData) {
  await requirePermission(PERMISSIONS.SYNC_ACCESS)
  const provider = requireProviderId(formData.get("provider"))
  const def = getProvider(provider)

  await prisma.providerSession.upsert({
    where: { provider },
    update: {
      status: "DISCONNECTED",
      lastError: null,
      profilePath: providerProfilePath(def.slug),
    },
    create: {
      provider,
      status: "DISCONNECTED",
      profilePath: providerProfilePath(def.slug),
    },
  })

  revalidateProviderPaths(provider)
}

/** Compat */
export async function startEnvatoSync() {
  const fd = new FormData()
  fd.set("provider", "ENVATO")
  return startProviderSync(fd)
}

export async function markEnvatoSynced() {
  const fd = new FormData()
  fd.set("provider", "ENVATO")
  return markProviderSynced(fd)
}

export async function disconnectEnvato() {
  const fd = new FormData()
  fd.set("provider", "ENVATO")
  return disconnectProvider(fd)
}
