"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"

import { FREE_DOWNLOAD_LIMIT } from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

export type QuotaMeterProps =
  | {
      mode: "unlimited"
      endsAt?: string
      className?: string
    }
  | {
      mode: "free"
      used: number
      remaining: number
      className?: string
    }
  | {
      mode: "empty"
      reason?: string
      className?: string
    }

export function QuotaMeter(props: QuotaMeterProps) {
  if (props.mode === "unlimited") {
    return (
      <div
        className={cn(
          "mich-quota-card relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--mich-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_10%,transparent)] px-4 py-3.5",
          props.className
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="mich-chip mich-chip-ok">Membresía</span>
          <p className="text-sm text-[var(--mich-text)]">
            Descargas ilimitadas
            {props.endsAt
              ? ` · hasta ${new Date(props.endsAt).toLocaleDateString("es")}`
              : ""}
          </p>
        </div>
      </div>
    )
  }

  if (props.mode === "empty") {
    return (
      <div
        className={cn(
          "mich-quota-card relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--mich-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--mich-danger)_8%,transparent)] px-4 py-3.5",
          props.className
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="mich-chip mich-chip-danger">Sin cupo</span>
          <p className="text-sm text-[var(--mich-muted)]">
            {props.reason ?? "Ya usaste tus descargas gratis."}{" "}
            <Link
              href="/recharge"
              className="font-medium text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
            >
              Ir a Recarga
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const total = Math.max(props.used + props.remaining, FREE_DOWNLOAD_LIMIT)
  const pct = total > 0 ? Math.min(100, (props.remaining / total) * 100) : 0
  const low = props.remaining <= 1

  return (
    <div
      className={cn(
        "mich-quota-card relative overflow-hidden rounded-2xl border px-4 py-3.5",
        low
          ? "border-[color-mix(in_srgb,var(--mich-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-warning)_10%,transparent)]"
          : "border-[var(--mich-border)] bg-[var(--mich-surface-muted)]/80",
        props.className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("mich-chip", low ? "mich-chip-warn" : "")}>
            Plan gratis
          </span>
          <p className="text-sm font-medium text-[var(--mich-text)]">
            Te quedan{" "}
            <span className="tabular-nums text-[var(--mich-blue-bright)]">
              {props.remaining}
            </span>{" "}
            de {total} descargas
          </p>
        </div>
        <Link
          href="/recharge"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
        >
          <Sparkles className="size-3.5" />
          Recargar
        </Link>
      </div>
      <div className="mich-quota-track mt-3 h-2 overflow-hidden rounded-full bg-[var(--mich-surface)] ring-1 ring-[var(--mich-border)]">
        <div
          className={cn(
            "mich-quota-fill h-full rounded-full transition-[width] duration-700 ease-out",
            low
              ? "bg-[linear-gradient(90deg,var(--mich-warning),#f59e0b)]"
              : "bg-[linear-gradient(90deg,var(--mich-blue),var(--mich-indigo))]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-[var(--mich-muted)]">
        Usadas: {props.used} · Cupo gratis visible en tiempo real
      </p>
    </div>
  )
}
