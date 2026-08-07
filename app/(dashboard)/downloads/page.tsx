import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  Loader2,
  XCircle,
} from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  hasPermission,
  requireUser,
} from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  PROVIDERS,
  providerList,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

const STATUS_LABEL = {
  QUEUED: "En cola",
  RUNNING: "Descargando",
  DONE: "Completada",
  FAILED: "Fallida",
} as const

type SearchParams = Promise<{
  provider?: string
  status?: string
  q?: string
}>

export default async function AdminDownloadsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const user = await requireUser()
  const allowed =
    user.isSuperAdmin ||
    hasPermission(user.permissions, PERMISSIONS.DOWNLOADS_READ) ||
    hasPermission(user.permissions, PERMISSIONS.SYNC_ACCESS)

  if (!allowed) {
    return <AccessDenied moduleName="Descargas" />
  }

  const params = await searchParams
  const providerFilter =
    params.provider === "ENVATO" || params.provider === "MAGNIFIC"
      ? params.provider
      : undefined
  const statusFilter =
    params.status === "QUEUED" ||
    params.status === "RUNNING" ||
    params.status === "DONE" ||
    params.status === "FAILED"
      ? params.status
      : undefined
  const q = params.q?.trim() || undefined

  const jobs = await prisma.downloadJob.findMany({
    where: {
      ...(providerFilter ? { provider: providerFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { url: { contains: q } },
              { fileName: { contains: q } },
              { requestedBy: { email: { contains: q } } },
              { requestedBy: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      requestedBy: { select: { id: true, name: true, email: true, phone: true, country: true } },
    },
  })

  const counts = await prisma.downloadJob.groupBy({
    by: ["status"],
    _count: { _all: true },
  })
  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  ) as Record<string, number>

  function hrefFor(next: {
    provider?: string | null
    status?: string | null
    q?: string | null
  }) {
    const sp = new URLSearchParams()
    const provider =
      "provider" in next ? next.provider : (params.provider ?? null)
    const status = "status" in next ? next.status : (params.status ?? null)
    const query = "q" in next ? next.q : (params.q ?? null)
    if (provider) sp.set("provider", provider)
    if (status) sp.set("status", status)
    if (query) sp.set("q", query)
    const s = sp.toString()
    return s ? `/downloads?${s}` : "/downloads"
  }

  return (
    <div className="space-y-8">
      <div className="mich-page-card relative px-6 py-7 sm:px-8">
        <div className="relative z-10">
          <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
            Admin
          </p>
          <h1 className="font-heading flex items-center gap-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-4xl">
            <Download className="size-8 text-[var(--mich-blue)]" />
            Descargas
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--mich-muted)]">
            Historial global: quién pidió cada recurso, estado y archivo.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["QUEUED", Clock3, "En cola"],
            ["RUNNING", Loader2, "En curso"],
            ["DONE", CheckCircle2, "OK"],
            ["FAILED", XCircle, "Fallidas"],
          ] as const
        ).map(([key, Icon, label]) => (
          <Link
            key={key}
            href={hrefFor({
              status: statusFilter === key ? null : key,
            })}
            className={cn(
              "mich-soft-card px-4 py-3 transition",
              statusFilter === key &&
                "border-[var(--mich-blue)]/50 shadow-[0_12px_30px_-20px_var(--mich-glow)]"
            )}
          >
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--mich-muted)]">
              <Icon className="size-3.5" />
              {label}
            </p>
            <p className="mt-1 font-heading text-2xl font-semibold text-[var(--mich-text)]">
              {countByStatus[key] ?? 0}
            </p>
          </Link>
        ))}
      </div>

      <form
        className="mich-soft-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
        action="/downloads"
        method="get"
      >
        <div className="space-y-1.5 sm:w-40">
          <label htmlFor="provider" className="text-xs font-medium text-[var(--mich-muted)]">
            Proveedor
          </label>
          <select
            id="provider"
            name="provider"
            defaultValue={providerFilter ?? ""}
            className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
          >
            <option value="">Todos</option>
            {providerList().map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortLabel}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:w-40">
          <label htmlFor="status" className="text-xs font-medium text-[var(--mich-muted)]">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="q" className="text-xs font-medium text-[var(--mich-muted)]">
            Buscar usuario / URL / archivo
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="nombre, correo, enlace…"
            className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-xl bg-[var(--mich-text)] px-5 text-sm font-semibold text-[var(--mich-surface)] dark:bg-white dark:text-[#0b1220]"
        >
          Filtrar
        </button>
      </form>

      <div className="mich-page-card relative overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead className="text-right">Archivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-[var(--mich-muted)]"
                >
                  No hay descargas con esos filtros.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const provider =
                  PROVIDERS[job.provider as ResourceProviderId]
                return (
                  <TableRow key={job.id}>
                    <TableCell className="whitespace-nowrap text-xs text-[var(--mich-muted)]">
                      {job.createdAt.toLocaleString("es", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-[var(--mich-text)]">
                        {job.requestedBy.name}
                      </p>
                      <p className="text-xs text-[var(--mich-muted)]">
                        {job.requestedBy.email}
                      </p>
                      {job.requestedBy.phone ? (
                        <p className="text-xs text-[var(--mich-muted)]">
                          {job.requestedBy.country
                            ? `${job.requestedBy.country} · `
                            : ""}
                          {job.requestedBy.phone}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <Image
                          src={provider?.logoSrc ?? "/envato.png"}
                          alt=""
                          width={18}
                          height={18}
                          unoptimized
                          className="size-4 object-contain"
                        />
                        {provider?.shortLabel ?? job.provider}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={job.status} />
                      {job.status === "FAILED" && job.error ? (
                        <p
                          className="mt-1 max-w-[180px] truncate text-[11px] text-destructive"
                          title={job.error}
                        >
                          {job.error}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
                        title={job.url}
                      >
                        {shortenUrl(job.url)}
                      </a>
                      {job.clientIp ? (
                        <p className="text-[10px] text-[var(--mich-muted)]">
                          IP {job.clientIp}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {job.status === "DONE" ? (
                        <a
                          href={`/api/downloads/${job.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
                        >
                          <Download className="size-3.5" />
                          {job.fileName ? trimName(job.fileName) : "Archivo"}
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--mich-muted)]">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-center text-xs text-[var(--mich-muted)]">
        Mostrando hasta 150 resultados más recientes.
      </p>
    </div>
  )
}

function StatusPill({
  status,
}: {
  status: keyof typeof STATUS_LABEL
}) {
  const styles = {
    QUEUED:
      "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] text-[var(--mich-muted)]",
    RUNNING:
      "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    DONE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    FAILED: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[status]
      )}
    >
      {status === "FAILED" ? <CircleAlert className="size-3" /> : null}
      {STATUS_LABEL[status]}
    </span>
  )
}

function shortenUrl(url: string) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, "")
    return path.length > 42 ? `${path.slice(0, 42)}…` : path || parsed.hostname
  } catch {
    return url.slice(0, 42)
  }
}

function trimName(name: string) {
  return name.length > 28 ? `${name.slice(0, 28)}…` : name
}
