"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CircleStop, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CANCEL_LOCK_MS = 60_000

type DownloadProgressCardProps = {
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED"
  providerLabel: string
  fileName?: string | null
  error?: string | null
  cancelling?: boolean
  onCancel?: () => void
  children?: ReactNode
}

export function DownloadProgressCard({
  status,
  providerLabel,
  fileName,
  error,
  cancelling,
  onCancel,
  children,
}: DownloadProgressCardProps) {
  const [pct, setPct] = useState(() =>
    status === "DONE" ? 100 : status === "FAILED" ? 0 : 8
  )
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  const active = status === "QUEUED" || status === "RUNNING"
  const cancelLocked = active && now - startedAt < CANCEL_LOCK_MS
  const lockLeft = Math.max(
    0,
    Math.ceil((CANCEL_LOCK_MS - (now - startedAt)) / 1000)
  )

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [active])

  useEffect(() => {
    if (status === "DONE") {
      setPct(100)
      return
    }
    if (status === "FAILED") {
      setPct((p) => Math.min(p, 12))
      return
    }

    const id = window.setInterval(() => {
      setPct((current) => {
        const elapsed = (Date.now() - startedAt) / 1000
        let target = 10
        if (status === "QUEUED") {
          target = Math.min(18, 8 + elapsed * 1.2)
        } else if (elapsed < 8) {
          target = 25 + elapsed * 4
        } else if (elapsed < 25) {
          target = 55 + (elapsed - 8) * 1.4
        } else {
          target = 78 + Math.min(14, (elapsed - 25) * 0.35)
        }
        target = Math.min(status === "QUEUED" ? 18 : 92, target)
        const next = current + (target - current) * 0.18
        return Math.max(current, Math.min(status === "QUEUED" ? 18 : 92, next))
      })
    }, 120)

    return () => window.clearInterval(id)
  }, [status, startedAt])

  const displayPct = Math.round(pct)
  const meta =
    status === "DONE"
      ? { label: "Listo", detail: "Ya puedes descargar el archivo." }
      : status === "FAILED"
        ? {
            label: "Finalizado",
            detail:
              error === "Cancelada por el usuario"
                ? "Cancelaste la descarga."
                : error || "La descarga no se completó.",
          }
        : status === "QUEUED" || displayPct < 22
          ? { label: "En cola", detail: "Preparando tu solicitud…" }
          : displayPct < 40
            ? {
                label: "Conectando",
                detail: `Abriendo ${providerLabel}…`,
              }
            : displayPct < 70
              ? {
                  label: "Descargando",
                  detail:
                    "Obteniendo el recurso. Archivos grandes pueden tardar 1–3 min.",
                }
              : {
                  label: "Casi listo",
                  detail: "Guardando el archivo… no cierres esta página.",
                }

  return (
    <div className="mich-dl-card mich-soft-card mt-0 w-full overflow-hidden px-4 py-5 text-left shadow-[0_16px_40px_-28px_var(--mich-glow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--mich-blue-bright)]">
            {meta.label}
          </p>
          <p className="mt-1.5 text-[15px] font-medium text-[var(--mich-text)]">
            {meta.detail}
          </p>
          {fileName && status === "DONE" ? (
            <p className="mt-1 truncate text-xs text-[var(--mich-muted)]">
              {fileName}
            </p>
          ) : null}
        </div>
        {active ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)]">
            <Loader2 className="size-5 animate-spin text-[var(--mich-blue)]" />
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-end justify-between text-xs">
          <span className="text-[var(--mich-muted)]">Progreso</span>
          <span className="font-heading text-lg font-semibold tabular-nums tracking-tight text-[var(--mich-text)]">
            {status === "FAILED" ? "—" : `${displayPct}%`}
          </span>
        </div>
        <div className="mich-dl-track relative h-3 overflow-hidden rounded-full bg-[var(--mich-surface)] ring-1 ring-[var(--mich-border)]">
          <div
            className={cn(
              "mich-dl-bar absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out",
              status === "FAILED" && "mich-dl-bar-failed",
              status === "DONE" && "mich-dl-bar-done",
              active && "mich-dl-bar-active"
            )}
            style={{ width: `${status === "FAILED" ? 8 : displayPct}%` }}
          />
          {active ? <div className="mich-dl-shimmer" aria-hidden /> : null}
        </div>
      </div>

      {active ? (
        <p className="mt-3 text-[12px] leading-5 text-[var(--mich-muted)]">
          Archivos pesados pueden tardar.{" "}
          <span className="font-medium text-[var(--mich-text)]">
            No canceles
          </span>{" "}
          hasta ver “Listo”.
        </p>
      ) : null}

      {active && onCancel ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(cancelling) || cancelLocked}
            onClick={onCancel}
            className="rounded-xl"
          >
            {cancelling ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CircleStop />
            )}
            {cancelLocked
              ? `Cancelar en ${lockLeft}s`
              : "Finalizar descarga"}
          </Button>
        </div>
      ) : null}

      {children}
    </div>
  )
}
