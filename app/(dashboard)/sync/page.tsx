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

      <div className="relative overflow-hidden rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] px-6 py-7 shadow-[0_20px_50px_-36px_rgba(11,18,32,0.4)] sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(rgba(93,156,236,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(93,156,236,0.07) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse at 20% 0%, black 10%, transparent 65%)",
          }}
        />
        <div className="relative">
          <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
            Admin
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-4xl">
            Sincronización
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--mich-muted)]">
            Inicia sesión por proveedor. El escritorio del worker aparece abajo
            en un iframe (maximiza si necesitas más espacio).
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--mich-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--mich-blue)]" />
            {readyCount}/{providerList().length} proveedores listos
            {anySyncing ? " · sincronizando…" : null}
          </p>
        </div>
      </div>

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
