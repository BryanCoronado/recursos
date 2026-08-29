"use client"

import Link from "next/link"

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
          "flex flex-wrap items-center gap-2 rounded-xl border border-[var(--mich-border)] px-3.5 py-2.5 text-sm",
          props.className
        )}
      >
        <span className="mich-chip mich-chip-ok">Membresía</span>
        <p className="text-[var(--mich-muted)]">
          Ilimitado
          {props.endsAt
            ? ` · hasta ${new Date(props.endsAt).toLocaleDateString("es")}`
            : ""}
        </p>
      </div>
    )
  }

  if (props.mode === "empty") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--mich-danger)_28%,transparent)] px-3.5 py-2.5 text-sm",
          props.className
        )}
      >
        <span className="mich-chip mich-chip-danger">Sin cupo</span>
        <p className="text-[var(--mich-muted)]">
          {props.reason ?? "Ya usaste tus descargas gratis."}{" "}
          <Link
            href="/recharge"
            className="font-medium text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
          >
            Recargar
          </Link>
        </p>
      </div>
    )
  }

  const total = Math.max(props.used + props.remaining, FREE_DOWNLOAD_LIMIT)
  const pct = total > 0 ? Math.min(100, (props.remaining / total) * 100) : 0
  const low = props.remaining <= 1

  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-2.5",
        low
          ? "border-[color-mix(in_srgb,var(--mich-warning)_30%,transparent)]"
          : "border-[var(--mich-border)]",
        props.className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--mich-text)]">
          <span className="tabular-nums font-semibold text-[var(--mich-blue-bright)]">
            {props.remaining}
          </span>{" "}
          de {total} descargas gratis
        </p>
        <Link
          href="/recharge"
          className="text-xs font-medium text-[var(--mich-blue-bright)] underline-offset-2 hover:underline"
        >
          Recargar
        </Link>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--mich-surface-muted)]">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            low ? "bg-[var(--mich-warning)]" : "bg-[var(--mich-blue)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
