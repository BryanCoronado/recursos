"use client"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import {
  AlertCircle,
  CheckCircle2,
  CircleStop,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

import type {
  ProviderDownloadState,
  ProviderHistoryItem,
} from "@/app/(dashboard)/resources/provider-download-actions"
import { QuotaMeter } from "@/components/billing/quota-meter"
import { ProviderHelpPanel } from "@/components/resources/provider-help-panel"
import { DownloadPreview } from "@/components/resources/download-preview"
import { DownloadProgressCard } from "@/components/resources/download-progress-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getOrCreateDeviceId } from "@/lib/billing/device-client"
import {
  notifyDownloadBrowser,
  setDownloadTabTitle,
} from "@/lib/feedback/download-notify"
import {
  PROVIDERS,
  type ResourceProviderId,
} from "@/lib/providers/catalog"

type ProviderQuota =
  | { allowed: true; unlimited: true; membershipEndsAt: string }
  | { allowed: true; unlimited: false; used: number; remaining: number }
  | {
      allowed: false
      unlimited: false
      used: number
      remaining: 0
      reason: string
    }

type ProviderDownloadFormProps = {
  provider: ResourceProviderId
  sessionReady: boolean
  initialHistory: ProviderHistoryItem[]
  quota: ProviderQuota
  createJob: (
    state: ProviderDownloadState,
    formData: FormData
  ) => Promise<ProviderDownloadState>
  getJob: (jobId: string) => Promise<{
    id: string
    status: ProviderHistoryItem["status"]
    fileName: string | null
    error: string | null
    logs?: string | null
  } | null>
  listHistory: () => Promise<ProviderHistoryItem[]>
  cancelJob: (jobId: string) => Promise<{ ok?: boolean; error?: string }>
  /** Ayuda (tutorial + enlace externo) */
  help?: {
    tutorialYoutubeUrl?: string
    browseUrl: string
    browseLabel: string
  }
}

type JobView = {
  id: string
  status: ProviderHistoryItem["status"]
  fileName: string | null
  error: string | null
  logs?: string | null
}

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

export function ProviderDownloadForm({
  provider,
  sessionReady,
  initialHistory,
  quota,
  createJob,
  getJob,
  listHistory,
  cancelJob,
  help,
}: ProviderDownloadFormProps) {
  const def = PROVIDERS[provider]
  const [state, formAction, pending] = useActionState(
    createJob,
    {} as ProviderDownloadState
  )
  const [job, setJob] = useState<JobView | null>(null)
  const [history, setHistory] = useState(initialHistory)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [logOpenId, setLogOpenId] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState("")
  const [, startTransition] = useTransition()
  const lastNotifiedStatus = useRef<string | null>(null)

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId())
  }, [])

  useEffect(() => {
    if (!job) {
      setDownloadTabTitle("IDLE", def.shortLabel)
      return
    }
    setDownloadTabTitle(job.status, def.shortLabel)

    const key = `${job.id}:${job.status}`
    if (
      (job.status === "DONE" || job.status === "FAILED") &&
      lastNotifiedStatus.current !== key
    ) {
      lastNotifiedStatus.current = key
      if (job.status === "DONE") {
        toast.success(`Descarga lista · ${def.shortLabel}`, {
          description: job.fileName ?? "El archivo ya está en el historial.",
          action: {
            label: "Abrir",
            onClick: () => {
              window.location.href = `/api/downloads/${job.id}`
            },
          },
        })
        notifyDownloadBrowser(
          `${def.shortLabel}: descarga completa`,
          job.fileName ?? "Tu recurso está listo",
          job.id
        )
      } else {
        toast.error(`Descarga fallida · ${def.shortLabel}`, {
          description: job.error ?? "Revisa el historial o inténtalo de nuevo.",
        })
        notifyDownloadBrowser(
          `${def.shortLabel}: descarga fallida`,
          job.error ?? "Hubo un error",
          job.id
        )
      }
    }
  }, [job, def.shortLabel])

  async function refreshHistory() {
    const next = await listHistory()
    setHistory(next)
  }

  async function handleCancel(jobId: string) {
    setCancellingId(jobId)
    try {
      const result = await cancelJob(jobId)
      if (result.error) {
        return
      }
      setJob((current) =>
        current?.id === jobId
          ? {
              ...current,
              status: "FAILED",
              error: "Cancelada por el usuario",
            }
          : current
      )
      await refreshHistory()
    } finally {
      setCancellingId(null)
    }
  }

  function downloadLogFile(jobId: string, logs: string) {
    const blob = new Blob([logs], { type: "text/plain;charset=utf-8" })
    const href = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = href
    a.download = `download-log-${jobId}.txt`
    a.click()
    URL.revokeObjectURL(href)
  }

  useEffect(() => {
    if (!state.jobId) return
    setJob({
      id: state.jobId,
      status: "QUEUED",
      fileName: null,
      error: null,
      logs: null,
    })
    void refreshHistory()
  }, [state.jobId])

  // Poll estable: solo depende del id + si sigue activo (no reinicia en cada RUNNING)
  const jobId = job?.id
  const jobActive =
    job?.status === "QUEUED" || job?.status === "RUNNING"

  useEffect(() => {
    if (!jobId || !jobActive) return

    let cancelled = false

    const tick = async () => {
      try {
        const next = await getJob(jobId)
        if (cancelled || !next) return
        setJob((prev) => {
          if (!prev || prev.id !== next.id) return prev
          if (
            prev.status === next.status &&
            prev.fileName === next.fileName &&
            prev.error === next.error &&
            prev.logs === (next.logs ?? null)
          ) {
            return prev
          }
          return {
            id: next.id,
            status: next.status,
            fileName: next.fileName,
            error: next.error,
            logs: next.logs ?? null,
          }
        })
        if (next.status === "DONE" || next.status === "FAILED") {
          await refreshHistory()
        }
      } catch {
        // ignore poll errors
      }
    }

    void tick()
    const timer = window.setInterval(() => {
      void tick()
    }, 1500)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [jobId, jobActive, getJob])

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-7.25rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.95fr)]">
      <section className="mich-page-card relative flex min-h-0 flex-col overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 lg:h-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-2">
              <Image
                src={def.logoSrc}
                alt={def.shortLabel}
                width={40}
                height={40}
                unoptimized
                className="size-8 object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-3xl font-medium tracking-[-0.03em] text-[var(--mich-text)] sm:text-4xl">
                {def.shortLabel}
              </h1>
              <p className="mt-1.5 max-w-md text-[15px] leading-6 text-[var(--mich-muted)]">
                Pega el enlace. El zip aparece aquí.
              </p>
            </div>
          </div>

          {help ? (
            <div className="mt-5">
              <ProviderHelpPanel
                tutorialYoutubeUrl={help.tutorialYoutubeUrl}
                browseUrl={help.browseUrl}
                browseLabel={help.browseLabel}
                providerLabel={def.shortLabel}
                align="start"
              />
            </div>
          ) : null}

          <div className="mt-5">
            {quota.unlimited ? (
              <QuotaMeter
                mode="unlimited"
                endsAt={
                  "membershipEndsAt" in quota
                    ? quota.membershipEndsAt
                    : undefined
                }
              />
            ) : quota.allowed ? (
              <QuotaMeter
                mode="free"
                used={quota.used}
                remaining={quota.remaining}
              />
            ) : (
              <QuotaMeter mode="empty" reason={quota.reason} />
            )}
          </div>

          {!sessionReady ? (
            <p className="mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--mich-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-warning)_12%,transparent)] px-4 py-3 text-sm text-[var(--mich-warning)]">
              {def.shortLabel} aún no está sincronizado. Pide al administrador
              que inicie sesión, o escríbenos por WhatsApp al{" "}
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

          <form action={formAction} className="mt-6 space-y-3">
            <label
              htmlFor={`${provider}-url`}
              className="block text-left text-sm font-medium text-[var(--mich-muted)]"
            >
              Enlace del recurso
            </label>
            <input type="hidden" name="deviceId" value={deviceId} />
            <Input
              id={`${provider}-url`}
              name="url"
              type="url"
              required
              disabled={!sessionReady || pending}
              aria-label={`URL de ${def.label}`}
              placeholder={def.sampleUrlPlaceholder}
              autoFocus
              className="h-12 rounded-xl border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-4 text-base text-[var(--mich-text)] placeholder:text-[var(--mich-muted)]/55 focus-visible:border-[var(--mich-text)]/30 focus-visible:ring-[var(--mich-text)]/15"
            />
            <Button
              type="submit"
              disabled={!sessionReady || pending || !quota.allowed}
              className="h-12 rounded-xl px-6"
            >
              {pending ? <Loader2 className="animate-spin" /> : <Download />}
              Descargar recurso
            </Button>
          </form>

          {state.error ? (
            <p role="alert" className="mt-3 text-left text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="mt-auto pt-5">
            {job ? (
              <DownloadProgressCard
                key={job.id}
                status={job.status}
                providerLabel={def.shortLabel}
                fileName={job.fileName}
                error={job.error}
                cancelling={cancellingId === job.id}
                onCancel={
                  job.status === "QUEUED" || job.status === "RUNNING"
                    ? () =>
                        startTransition(async () => {
                          await handleCancel(job.id)
                        })
                    : undefined
                }
              >
                {job.status === "RUNNING" ? (
                  <DownloadPreview jobId={job.id} />
                ) : null}
                {job.status === "FAILED" && job.logs ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setLogOpenId((id) => (id === job.id ? null : job.id))
                        }
                      >
                        <FileText />
                        {logOpenId === job.id ? "Ocultar log" : "Ver log"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => downloadLogFile(job.id, job.logs!)}
                      >
                        <Download />
                        Descargar log
                      </Button>
                    </div>
                    {logOpenId === job.id ? (
                      <pre className="max-h-40 overflow-auto rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-3 text-left text-[11px] leading-relaxed text-[var(--mich-muted)] whitespace-pre-wrap">
                        {job.logs}
                      </pre>
                    ) : null}
                  </div>
                ) : null}
                {job.status === "DONE" ? (
                  <a
                    href={`/api/downloads/${job.id}`}
                    className="mt-4 inline-flex items-center gap-2 font-medium text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
                  >
                    <Download className="size-4" />
                    {job.fileName ?? "Descargar archivo"}
                  </a>
                ) : null}
              </DownloadProgressCard>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--mich-border)] px-4 py-4 text-sm text-[var(--mich-muted)]">
                El progreso de la descarga aparecerá aquí.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Derecha: historial */}
      <section className="mich-page-card relative flex min-h-[22rem] flex-col lg:h-full lg:min-h-0">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--mich-border)] px-5 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
                Historial
              </h2>
              {history.length > 0 ? (
                <span className="text-xs tabular-nums text-[var(--mich-muted)]">
                  {history.length}
                </span>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              startTransition(async () => {
                await refreshHistory()
              })
            }
          >
            Actualizar
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {history.length === 0 ? (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-5 text-center">
              <p className="text-sm font-medium text-[var(--mich-text)]">
                Sin descargas
              </p>
              <p className="mt-1 text-sm text-[var(--mich-muted)]">
                Pega un enlace a la izquierda.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--mich-border)]">
              {history.map((item) => (
                <li key={item.id} className="px-1 py-3.5">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-[11px] text-[var(--mich-muted)]">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-[var(--mich-text)]">
                      {item.fileName || shortenUrl(item.url)}
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-[var(--mich-muted)] hover:text-[var(--mich-blue-bright)]"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      <span className="truncate">{item.url}</span>
                    </a>
                    {item.status === "FAILED" && item.error ? (
                      <p className="text-xs text-destructive line-clamp-2">
                        {item.error}
                      </p>
                    ) : null}
                    {item.status === "FAILED" && item.logs ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setLogOpenId((id) =>
                                id === item.id ? null : item.id
                              )
                            }
                          >
                            <FileText />
                            {logOpenId === item.id ? "Ocultar log" : "Ver log"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => downloadLogFile(item.id, item.logs!)}
                          >
                            <Download />
                            Descargar log
                          </Button>
                        </div>
                        {logOpenId === item.id ? (
                          <pre className="max-h-36 overflow-auto rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-3 text-[11px] leading-relaxed text-[var(--mich-muted)] whitespace-pre-wrap">
                            {item.logs}
                          </pre>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {item.status === "DONE" ? (
                      <a href={`/api/downloads/${item.id}`}>
                        <Button type="button" size="sm" className="rounded-xl">
                          <Download />
                          Descargar
                        </Button>
                      </a>
                    ) : item.status === "QUEUED" ||
                      item.status === "RUNNING" ? (
                      <>
                        <span className="inline-flex items-center gap-2 text-xs text-[var(--mich-muted)]">
                          <Loader2 className="size-3.5 animate-spin" />
                          En proceso
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          disabled={cancellingId === item.id}
                          onClick={() =>
                            startTransition(async () => {
                              await handleCancel(item.id)
                            })
                          }
                        >
                          {cancellingId === item.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <CircleStop />
                          )}
                          Finalizar
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: ProviderHistoryItem["status"]
}) {
  const styles = {
    QUEUED:
      "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] text-[var(--mich-muted)]",
    RUNNING:
      "border-[color-mix(in_srgb,var(--mich-blue)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-blue)_14%,transparent)] text-[var(--mich-blue-bright)]",
    DONE: "border-[color-mix(in_srgb,var(--mich-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_12%,transparent)] text-[var(--mich-success)]",
    FAILED:
      "border-[color-mix(in_srgb,var(--mich-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-danger)_12%,transparent)] text-[var(--mich-danger)]",
  } as const

  const Icon = {
    QUEUED: Clock3,
    RUNNING: Loader2,
    DONE: CheckCircle2,
    FAILED: AlertCircle,
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      <Icon
        className={`size-3 ${status === "RUNNING" ? "animate-spin" : ""}`}
      />
      {statusLabel[status]}
    </span>
  )
}
