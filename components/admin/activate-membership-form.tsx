"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import {
  activateMembership,
  type MembershipActionState,
} from "@/app/(dashboard)/subscriptions/actions"
import { ProviderSelect } from "@/components/providers/provider-select"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  EXTRA_DEVICE_MONTHLY_SOLES,
  MAX_DEVICES,
  MIN_DEVICES,
  MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  membershipTotalSoles,
  type SubscriptionPlanKey,
} from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

type UserOption = {
  id: string
  name: string
  email: string
  phone?: string | null
}

export function ActivateMembershipForm({ users }: { users: UserOption[] }) {
  const [state, action, pending] = useActionState(
    activateMembership,
    {} as MembershipActionState
  )
  const [plan, setPlan] = useState<SubscriptionPlanKey>("MONTHLY")
  const [maxDevices, setMaxDevices] = useState(1)
  const [userId, setUserId] = useState("")

  const total = useMemo(
    () => membershipTotalSoles(plan, maxDevices),
    [plan, maxDevices]
  )
  const months = SUBSCRIPTION_PLANS[plan].months
  const extras = Math.max(0, maxDevices - 1)
  const extraTotal = extras * EXTRA_DEVICE_MONTHLY_SOLES * months
  const selected = users.find((u) => u.id === userId)

  useEffect(() => {
    if (state.ok) {
      toast.success("Membresía activada", {
        description: state.ok,
      })
    }
    if (state.error) {
      toast.error("No se pudo activar", { description: state.error })
    }
  }, [state.ok, state.error, state.membershipId])

  return (
    <form action={action} className="space-y-4">
      <ProviderSelect name="provider" defaultValue="ENVATO" />

      <div className="space-y-1.5">
        <label htmlFor="userId" className="text-sm font-medium">
          Cliente
        </label>
        <select
          id="userId"
          name="userId"
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
        >
          <option value="">Selecciona un usuario</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} — {user.email}
              {user.phone ? ` · ${user.phone}` : ""}
            </option>
          ))}
        </select>
        {selected && !selected.phone ? (
          <p className="text-xs text-[var(--mich-warning)]">
            Este usuario no tiene celular: no podrás avisar por WhatsApp
            automáticamente.
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="plan" className="text-sm font-medium">
          Plan (S/ {MONTHLY_PRICE_SOLES}/mes base)
        </label>
        <select
          id="plan"
          name="plan"
          required
          value={plan}
          onChange={(e) => setPlan(e.target.value as SubscriptionPlanKey)}
          className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
        >
          {(
            Object.keys(SUBSCRIPTION_PLANS) as Array<keyof typeof SUBSCRIPTION_PLANS>
          ).map((key) => {
            const p = SUBSCRIPTION_PLANS[key]
            return (
              <option key={key} value={key}>
                {p.label} — base S/ {p.totalSoles}
                {key !== "MONTHLY" ? " (descuento)" : ""}
              </option>
            )
          })}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="maxDevices" className="text-sm font-medium">
          Dispositivos
        </label>
        <select
          id="maxDevices"
          name="maxDevices"
          value={maxDevices}
          onChange={(e) => setMaxDevices(Number(e.target.value))}
          className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
        >
          {Array.from(
            { length: MAX_DEVICES - MIN_DEVICES + 1 },
            (_, i) => MIN_DEVICES + i
          ).map((n) => (
            <option key={n} value={n}>
              {n} dispositivo{n === 1 ? "" : "s"}
              {n === 1
                ? " (incluido)"
                : ` (+S/ ${EXTRA_DEVICE_MONTHLY_SOLES}/mes × ${n - 1})`}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--mich-muted)]">
          Total a cobrar:{" "}
          <span className="font-semibold text-[var(--mich-text)]">
            S/ {total}
          </span>
          {extraTotal > 0
            ? ` (plan S/ ${SUBSCRIPTION_PLANS[plan].totalSoles} + dispositivos S/ ${extraTotal})`
            : null}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas (opcional)
        </label>
        <Input
          id="notes"
          name="notes"
          placeholder="Pago Yape, transferencia…"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <div className="space-y-3 rounded-2xl border border-[color-mix(in_srgb,var(--mich-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_10%,transparent)] px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--mich-success)]">
            <CheckCircle2 className="size-4" />
            {state.ok}
          </p>
          {state.notifyWhatsAppUrl ? (
            <a
              href={state.notifyWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-xl bg-[#25D366] text-white hover:bg-[#1ebe57]"
              )}
            >
              <MessageCircle />
              Avisar al cliente por WhatsApp
            </a>
          ) : (
            <p className="text-xs text-[var(--mich-muted)]">
              Sin celular en el perfil: avísale manualmente que su plan está
              listo.
            </p>
          )}
        </div>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full rounded-xl sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Activando…
          </>
        ) : (
          `Activar · S/ ${total}`
        )}
      </Button>
    </form>
  )
}
