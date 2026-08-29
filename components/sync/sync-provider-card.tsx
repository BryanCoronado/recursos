"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition, type ReactNode } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogIn,
  PlugZap,
  Unplug,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ProviderDefinition } from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

type SessionStatus = "DISCONNECTED" | "SYNCING" | "READY" | "EXPIRED"

type SyncProviderCardProps = {
  provider: ProviderDefinition
  status: SessionStatus
  lastSyncedAt: string | null
  lastError: string | null
  startAction: (formData: FormData) => Promise<void>
  readyAction: (formData: FormData) => Promise<void>
  disconnectAction: (formData: FormData) => Promise<void>
}

const STATUS_UI: Record<
  SessionStatus,
  {
    label: string
    hint: string
    badge: string
    ring: string
    icon: ReactNode
  }
> = {
  READY: {
    label: "Sincronizado",
    hint: "Sesión activa y lista para descargas",
    badge:
      "border-[color-mix(in_srgb,var(--mich-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_12%,transparent)] text-[var(--mich-success)]",
    ring: "border-[color-mix(in_srgb,var(--mich-success)_40%,transparent)]",
    icon: <CheckCircle2 className="size-5" />,
  },
  SYNCING: {
    label: "Esperando login",
    hint: "Abre el navegador del worker e inicia sesión",
    badge:
      "border-[color-mix(in_srgb,var(--mich-blue)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-blue)_12%,transparent)] text-[var(--mich-blue)]",
    ring: "border-[color-mix(in_srgb,var(--mich-blue)_40%,transparent)]",
    icon: <Loader2 className="size-5 animate-spin" />,
  },
  EXPIRED: {
    label: "Sesión expirada",
    hint: "Vuelve a iniciar sesión y marca como listo",
    badge:
      "border-[color-mix(in_srgb,var(--mich-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-warning)_12%,transparent)] text-[var(--mich-warning)]",
    ring: "border-[color-mix(in_srgb,var(--mich-warning)_40%,transparent)]",
    icon: <AlertTriangle className="size-5" />,
  },
  DISCONNECTED: {
    label: "Desconectado",
    hint: "Aún no hay sesión guardada",
    badge:
      "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] text-[var(--mich-muted)]",
    ring: "border-[var(--mich-border)]",
    icon: <Unplug className="size-5" />,
  },
}

export function SyncProviderCard({
  provider,
  status,
  lastSyncedAt,
  lastError,
  startAction,
  readyAction,
  disconnectAction,
}: SyncProviderCardProps) {
  const ui = STATUS_UI[status]
  const syncedLabel = lastSyncedAt
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSyncedAt))
    : null

  return (
    <article
      className={cn(
        "mich-soft-card p-5 sm:p-6",
        ui.ring
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-2">
            <Image
              src={provider.logoSrc}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="size-9 object-contain"
            />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading truncate text-lg font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
              {provider.label}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--mich-muted)]">{ui.hint}</p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
            ui.badge
          )}
        >
          {ui.icon}
          {ui.label}
        </span>
      </div>

      {status === "READY" ? (
        <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--mich-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_10%,transparent)] px-4 py-3 text-sm text-[var(--mich-success)]">
          <CheckCircle2 className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Sesión lista</p>
            {syncedLabel ? (
              <p className="text-xs opacity-80">Última sync: {syncedLabel}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {status === "SYNCING" ? (
        <div className="relative mt-5 rounded-2xl border border-sky-500/25 bg-sky-500/8 px-4 py-3 text-sm text-sky-900 dark:text-sky-100">
          <p className="font-medium">Paso actual</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[var(--mich-muted)] dark:text-sky-100/80">
            <li>Espera a que se abra Chromium en el worker / VNC.</li>
            <li>Inicia sesión en {provider.shortLabel} (no cierres con la X).</li>
            <li>
              Vuelve aquí y pulsa <strong>Marcar como listo</strong>.
            </li>
          </ol>
        </div>
      ) : null}

      {lastError ? (
        <p className="relative mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {lastError}
        </p>
      ) : null}

      <div className="relative mt-5 flex flex-wrap gap-2">
        <ActionButton
          action={startAction}
          provider={provider.id}
          successMessage="Iniciando sesión… revisa el navegador del worker"
          variant="default"
          disabled={status === "SYNCING"}
        >
          <LogIn className="size-4" />
          {status === "SYNCING" ? "Navegador abriéndose…" : "Iniciar sesión"}
        </ActionButton>

        <ActionButton
          action={readyAction}
          provider={provider.id}
          successMessage="Sesión marcada como lista"
          variant="outline"
          disabled={status === "READY"}
        >
          <PlugZap className="size-4" />
          Marcar como listo
        </ActionButton>

        <ActionButton
          action={disconnectAction}
          provider={provider.id}
          successMessage="Sesión desconectada"
          variant="destructive"
          disabled={status === "DISCONNECTED"}
        >
          <Unplug className="size-4" />
          Desconectar
        </ActionButton>
      </div>
    </article>
  )
}

function ActionButton({
  action,
  provider,
  successMessage,
  children,
  variant,
  disabled,
}: {
  action: (formData: FormData) => Promise<void>
  provider: string
  successMessage: string
  children: ReactNode
  variant: "default" | "outline" | "destructive"
  disabled?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 2800)
    return () => window.clearTimeout(t)
  }, [flash])

  return (
    <div className="space-y-1.5">
      <form
        action={(formData) => {
          startTransition(async () => {
            await action(formData)
            setFlash(successMessage)
            router.refresh()
          })
        }}
      >
        <input type="hidden" name="provider" value={provider} />
        <Button
          type="submit"
          variant={variant}
          disabled={disabled || pending}
          className="min-w-[10.5rem]"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Aplicando…
            </>
          ) : (
            children
          )}
        </Button>
      </form>
      {flash ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--mich-success)]">
          <CheckCircle2 className="size-3.5" />
          {flash}
        </p>
      ) : null}
    </div>
  )
}
