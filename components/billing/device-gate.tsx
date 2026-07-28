"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { Loader2, MonitorSmartphone, MessageCircle } from "lucide-react"

import { claimDeviceAction } from "@/app/(dashboard)/devices/actions"
import { buttonVariants } from "@/components/ui/button"
import { getOrCreateDeviceId } from "@/lib/billing/device-client"
import { EXTRA_DEVICE_MONTHLY_SOLES } from "@/lib/billing/plans"
import { getProvider, type ResourceProviderId } from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

type DeviceGateProps = {
  provider: ResourceProviderId
  children: ReactNode
  /** URL WhatsApp para pedir más dispositivos */
  upgradeWhatsAppUrl?: string
}

type GateState =
  | { status: "loading" }
  | { status: "ready" }
  | {
      status: "blocked"
      message: string
      maxDevices: number
      used: number
    }

export function DeviceGate({
  provider,
  children,
  upgradeWhatsAppUrl,
}: DeviceGateProps) {
  const [state, setState] = useState<GateState>({ status: "loading" })
  const def = getProvider(provider)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const deviceId = getOrCreateDeviceId()
      const result = await claimDeviceAction({
        provider,
        deviceId,
        userAgent: navigator.userAgent,
      })
      if (cancelled) return
      if (!result.ok) {
        setState({
          status: "blocked",
          message: result.message,
          maxDevices: result.maxDevices,
          used: result.used,
        })
        return
      }
      setState({ status: "ready" })
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [provider])

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[var(--mich-muted)]">
        <Loader2 className="size-6 animate-spin text-[var(--mich-blue)]" />
        <p className="text-sm">Verificando dispositivo…</p>
      </div>
    )
  }

  if (state.status === "blocked") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] px-6 py-12 text-center shadow-[0_20px_50px_-36px_rgba(11,18,32,0.35)]">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)]">
          <MonitorSmartphone className="size-7 text-[var(--mich-blue)]" />
        </span>
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
          Dispositivo no autorizado
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-[var(--mich-muted)]">
          {state.message}
        </p>
        <p className="mt-2 text-sm text-[var(--mich-muted)]">
          Cupos {def.shortLabel}:{" "}
          <span className="font-semibold text-[var(--mich-text)]">
            {state.used}/{state.maxDevices}
          </span>
          {" · "}
          +S/ {EXTRA_DEVICE_MONTHLY_SOLES}/mes por dispositivo extra
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/devices"
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-xl"
            )}
          >
            Mis dispositivos
          </Link>
          {upgradeWhatsAppUrl ? (
            <a
              href={upgradeWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl"
              )}
            >
              <MessageCircle className="size-4" />
              Pedir más cupos
            </a>
          ) : null}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
