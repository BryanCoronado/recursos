"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Loader2, MonitorSmartphone, MessageCircle } from "lucide-react"

import { enforceSessionDevicesAction } from "@/app/(dashboard)/devices/actions"
import { buttonVariants } from "@/components/ui/button"
import { getOrCreateDeviceId } from "@/lib/billing/device-client"
import { EXTRA_DEVICE_MONTHLY_SOLES } from "@/lib/billing/plans"
import { getProvider, type ResourceProviderId } from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

/** Rutas permitidas aunque el dispositivo no tenga cupo (para liberar / pedir upgrade). */
const ALLOWED_WHEN_BLOCKED = new Set([
  "/devices",
  "/recharge",
  "/change-password",
])

type GuardState =
  | { status: "loading" }
  | { status: "ready" }
  | {
      status: "blocked"
      message: string
      maxDevices: number
      used: number
      provider: ResourceProviderId
    }

export function DeviceSessionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [state, setState] = useState<GuardState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    async function run() {
      const deviceId = getOrCreateDeviceId()
      const result = await enforceSessionDevicesAction({
        deviceId,
        userAgent: navigator.userAgent,
      })
      if (cancelled) return
      if (result.blocked) {
        setState({
          status: "blocked",
          message: result.message,
          maxDevices: result.maxDevices,
          used: result.used,
          provider: result.provider,
        })
        return
      }
      setState({ status: "ready" })
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [pathname])

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-[var(--mich-muted)]">
        <Loader2 className="size-6 animate-spin text-[var(--mich-blue)]" />
        <p className="text-sm">Verificando dispositivo…</p>
      </div>
    )
  }

  const allowThrough =
    state.status === "ready" ||
    ALLOWED_WHEN_BLOCKED.has(pathname) ||
    pathname.startsWith("/devices")

  if (state.status === "blocked" && !allowThrough) {
    const def = getProvider(state.provider)
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
            className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
          >
            Mis dispositivos
          </Link>
          <Link
            href="/recharge"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            <MessageCircle className="size-4" />
            Ampliar plan
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
