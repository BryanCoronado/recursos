"use client"

import Image from "next/image"
import { useActionState, useEffect, useState, useTransition } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react"

import {
  createEnvatoDownloadJob,
  getEnvatoDownloadJob,
  listEnvatoDownloadHistory,
  type EnvatoDownloadState,
  type EnvatoHistoryItem,
} from "@/app/(dashboard)/envato/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type EnvatoDownloadFormProps = {
  sessionReady: boolean
  initialHistory: EnvatoHistoryItem[]
}

type JobView = {
  id: string
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED"
  fileName: string | null
  error: string | null
}

const statusCopy = {
  QUEUED: "En cola… el worker tomará el trabajo en breve.",
  RUNNING: "Descargando en Envato Elements…",
  DONE: "Listo. Ya puedes bajar el archivo.",
  FAILED: "La descarga falló.",
} as const

const statusLabel = {
  QUEUED: "En cola",
  RUNNING: "Descargando",
  DONE: "Completada",
  FAILED: "Fallida",
} as const

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function shortenUrl(url: string) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, "")
    return path.length > 48 ? `${path.slice(0, 48)}…` : path || parsed.hostname
  } catch {
    return url.slice(0, 48)
  }
}

export function EnvatoDownloadForm({
  sessionReady,
  initialHistory,
}: EnvatoDownloadFormProps) {
  const [state, formAction, pending] = useActionState(
    createEnvatoDownloadJob,
    {} as EnvatoDownloadState
  )
  const [job, setJob] = useState<JobView | null>(null)
  const [history, setHistory] = useState(initialHistory)
  const [, startTransition] = useTransition()

  async function refreshHistory() {
    const next = await listEnvatoDownloadHistory()
    setHistory(next)
  }

  useEffect(() => {
    if (!state.jobId) return
    setJob({
      id: state.jobId,
      status: "QUEUED",
      fileName: null,
      error: null,
    })
    startTransition(() => {
      void refreshHistory()
    })
  }, [state.jobId])

  useEffect(() => {
    if (!job || job.status === "DONE" || job.status === "FAILED") return

    const timer = window.setInterval(() => {
      startTransition(async () => {
        const next = await getEnvatoDownloadJob(job.id)
        if (!next) return
        setJob({
          id: next.id,
          status: next.status,
          fileName: next.fileName,
          error: next.error,
        })
        if (next.status === "DONE" || next.status === "FAILED") {
          await refreshHistory()
        } else {
          setHistory((current) =>
            current.map((item) =>
              item.id === next.id
                ? {
                    ...item,
                    status: next.status,
                    fileName: next.fileName,
                    error: next.error,
                  }
                : item
            )
          )
        }
      })
    }, 2000)

    return () => window.clearInterval(timer)
  }, [job])

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-3xl border border-[var(--mich-border)] bg-white px-6 py-16 shadow-[0_24px_60px_-36px_rgba(11,18,32,0.3)] sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(93,156,236,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(93,156,236,0.08) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage:
              "radial-gradient(ellipse at center, black 18%, transparent 70%)",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--mich-blue)]/15 blur-[120px]" />

        <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-[var(--mich-border)] bg-white p-3 shadow-[0_12px_30px_-16px_var(--mich-glow)]">
            <Image
              src="/envato.png"
              alt="Envato"
              width={72}
              height={72}
              className="h-14 w-14 object-contain"
              priority
            />
          </div>
          <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--mich-blue-bright)]">
            Módulo de recursos
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-5xl">
            Envato
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-[var(--mich-muted)]">
            Pega el enlace de Elements y descarga el recurso con la sesión
            sincronizada.
          </p>

          {!sessionReady ? (
            <p className="mx-auto mt-8 max-w-md rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Envato aún no está sincronizado. Pide al administrador que inicie
              sesión, o escríbenos por WhatsApp al{" "}
              <a
                className="font-medium underline underline-offset-2"
                href="https://wa.me/51917080235"
                target="_blank"
                rel="noreferrer"
              >
                +51 917 080 235
              </a>
              .
            </p>
          ) : null}

          <form action={formAction} className="mt-10 space-y-4">
            <Input
              name="url"
              type="url"
              required
              disabled={!sessionReady || pending}
              aria-label="URL de Envato Elements"
              placeholder="https://elements.envato.com/..."
              autoFocus
              className="h-14 rounded-2xl border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-5 text-base text-[var(--mich-text)] shadow-sm placeholder:text-[var(--mich-muted)]/55 focus-visible:border-[var(--mich-blue)]/55 focus-visible:ring-[var(--mich-blue)]/25"
            />
            <Button
              type="submit"
              disabled={!sessionReady || pending}
              className="h-11 rounded-xl px-6"
            >
              {pending ? <Loader2 className="animate-spin" /> : <Download />}
              Descargar recurso
            </Button>
          </form>

          {state.error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          {job ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-4 py-4 text-left text-sm">
              <p className="font-medium text-[var(--mich-text)]">
                {statusCopy[job.status]}
              </p>
              {job.status === "QUEUED" || job.status === "RUNNING" ? (
                <p className="mt-2 flex items-center gap-2 text-[var(--mich-muted)]">
                  <Loader2 className="size-4 animate-spin" />
                  Estado: {job.status}
                </p>
              ) : null}
              {job.status === "FAILED" && job.error ? (
                <p className="mt-2 text-destructive">{job.error}</p>
              ) : null}
              {job.status === "DONE" ? (
                <a
                  href={`/api/downloads/${job.id}`}
                  className="mt-3 inline-flex items-center gap-2 font-medium text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
                >
                  <Download className="size-4" />
                  {job.fileName ?? "Descargar archivo"}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--mich-border)] bg-white p-6 shadow-[0_16px_40px_-32px_rgba(11,18,32,0.25)] sm:p-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
              Historial de descargas
            </h2>
            <p className="mt-1 text-sm text-[var(--mich-muted)]">
              Tus últimas solicitudes en Envato Elements.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(async () => {
                await refreshHistory()
              })
            }
          >
            Actualizar
          </Button>
        </div>

        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--mich-border)] px-4 py-10 text-center text-sm text-[var(--mich-muted)]">
            Aún no hay descargas. Pega un enlace arriba para empezar.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--mich-border)]">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-[var(--mich-muted)]">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="truncate font-medium text-[var(--mich-text)]">
                    {item.fileName || shortenUrl(item.url)}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-xs text-[var(--mich-muted)] hover:text-[var(--mich-blue-bright)]"
                  >
                    <ExternalLink className="size-3 shrink-0" />
                    <span className="truncate">{item.url}</span>
                  </a>
                  {item.status === "FAILED" && item.error ? (
                    <p className="text-xs text-destructive line-clamp-2">
                      {item.error}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0">
                  {item.status === "DONE" ? (
                    <a href={`/api/downloads/${item.id}`}>
                      <Button type="button" size="sm" variant="outline">
                        <Download />
                        Descargar
                      </Button>
                    </a>
                  ) : item.status === "QUEUED" || item.status === "RUNNING" ? (
                    <span className="inline-flex items-center gap-2 text-xs text-[var(--mich-muted)]">
                      <Loader2 className="size-3.5 animate-spin" />
                      En proceso
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: EnvatoHistoryItem["status"]
}) {
  const styles = {
    QUEUED: "bg-slate-100 text-slate-700",
    RUNNING: "bg-sky-100 text-sky-800",
    DONE: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-red-100 text-red-800",
  } as const

  const Icon = {
    QUEUED: Clock3,
    RUNNING: Loader2,
    DONE: CheckCircle2,
    FAILED: AlertCircle,
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      <Icon
        className={`size-3 ${status === "RUNNING" ? "animate-spin" : ""}`}
      />
      {statusLabel[status]}
    </span>
  )
}
