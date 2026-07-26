import { RefreshCw } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

import {
  disconnectEnvato,
  markEnvatoSynced,
  startEnvatoSync,
} from "./actions"

const statusLabel = {
  DISCONNECTED: "Desconectado",
  SYNCING: "Sincronizando",
  READY: "Listo",
  EXPIRED: "Sesión expirada",
} as const

export default async function SyncPage() {
  const access = await requirePagePermission(PERMISSIONS.SYNC_ACCESS)
  if (!access.allowed) return <AccessDenied moduleName="Sincronización" />

  const session = await prisma.providerSession.findUnique({
    where: { provider: "ENVATO" },
  })

  const status = session?.status ?? "DISCONNECTED"

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
          Admin
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)]">
          Sincronización
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[var(--mich-muted)]">
          Inicia sesión manualmente en Envato Elements. El worker abrirá Chromium
          y guardará la sesión para las descargas de los clientes.
        </p>
      </div>

      <Card className="border-[var(--mich-border)] bg-[var(--mich-surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="size-4 text-[var(--mich-blue)]" />
            Envato Elements
          </CardTitle>
          <CardDescription>
            Estado actual: <strong>{statusLabel[status]}</strong>
            {session?.lastSyncedAt
              ? ` · Última sync: ${new Intl.DateTimeFormat("es", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(session.lastSyncedAt)}`
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--mich-muted)]">
            <li>Asegúrate de tener corriendo <code>npm run worker</code>.</li>
            <li>Pulsa <strong>Iniciar Envato</strong> y espera el navegador.</li>
            <li>Inicia sesión en elements.envato.com (no cierres con la X).</li>
            <li>
              Cuando ya estés dentro, vuelve aquí y pulsa{" "}
              <strong>Marcar como listo</strong>: el navegador se cerrará solo y
              la sesión queda guardada.
            </li>
            <li>
              Los clics/XPath no se graban aquí: se configuran en{" "}
              <strong>Automatizaciones</strong> (hay una regla genérica de
              Download lista).
            </li>
          </ol>

          {session?.lastError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {session.lastError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <form action={startEnvatoSync}>
              <Button type="submit">Iniciar Envato</Button>
            </form>
            <form action={markEnvatoSynced}>
              <Button type="submit" variant="outline">
                Marcar como listo
              </Button>
            </form>
            <form action={disconnectEnvato}>
              <Button type="submit" variant="destructive">
                Desconectar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
