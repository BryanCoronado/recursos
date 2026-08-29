import { AccessDenied } from "@/components/auth/access-denied"
import { SyncAutoRefresh } from "@/components/sync/sync-auto-refresh"
import { SyncProviderCard } from "@/components/sync/sync-provider-card"
import { NovncPanel } from "@/components/worker/novnc-panel"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { getNovncViewerUrl } from "@/lib/novnc"
import { providerList, type ResourceProviderId } from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

import {
  disconnectProvider,
  markProviderSynced,
  startProviderSync,
} from "./actions"

export default async function SyncPage() {
  const access = await requirePagePermission(PERMISSIONS.SYNC_ACCESS)
  if (!access.allowed) return <AccessDenied moduleName="Sincronización" />

  const sessions = await prisma.providerSession.findMany()
  const byProvider = Object.fromEntries(
    sessions.map((s) => [s.provider, s])
  ) as Partial<Record<ResourceProviderId, (typeof sessions)[number]>>

  const anySyncing = sessions.some((s) => s.status === "SYNCING")
  const readyCount = providerList().filter(
    (p) => byProvider[p.id]?.status === "READY"
  ).length
  const novncUrl = getNovncViewerUrl()

  return (
    <div className="space-y-8">
      <SyncAutoRefresh active={anySyncing} />

      <section>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-3xl">
          Sincronización
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-[var(--mich-muted)]">
          Inicia sesión por proveedor. El escritorio del worker aparece abajo
          en un iframe (maximiza si necesitas más espacio).
        </p>
        <p className="mich-chip mt-4">
          <span className="size-1.5 rounded-full bg-[var(--mich-blue)]" />
          {readyCount}/{providerList().length} proveedores listos
          {anySyncing ? " · sincronizando…" : null}
        </p>
      </section>

      <NovncPanel
        viewerUrl={novncUrl}
        autoOpen={anySyncing}
        title="Escritorio del worker (login)"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {providerList().map((provider) => {
          const session = byProvider[provider.id]
          const status = session?.status ?? "DISCONNECTED"

          return (
            <SyncProviderCard
              key={provider.id}
              provider={provider}
              status={status}
              lastSyncedAt={session?.lastSyncedAt?.toISOString() ?? null}
              lastError={session?.lastError ?? null}
              startAction={startProviderSync}
              readyAction={markProviderSynced}
              disconnectAction={disconnectProvider}
            />
          )
        })}
      </div>
    </div>
  )
}
