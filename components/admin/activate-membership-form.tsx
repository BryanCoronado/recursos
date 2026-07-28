"use client"

import { useActionState, useMemo, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import {
  activateMembership,
  type MembershipActionState,
} from "@/app/(dashboard)/subscriptions/actions"
import { ProviderSelect } from "@/components/providers/provider-select"
import { Button } from "@/components/ui/button"
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

type UserOption = { id: string; name: string; email: string }

export function ActivateMembershipForm({ users }: { users: UserOption[] }) {
  const [state, action, pending] = useActionState(
    activateMembership,
    {} as MembershipActionState
  )
  const [plan, setPlan] = useState<SubscriptionPlanKey>("MONTHLY")
  const [maxDevices, setMaxDevices] = useState(1)

  const total = useMemo(
    () => membershipTotalSoles(plan, maxDevices),
    [plan, maxDevices]
  )
  const months = SUBSCRIPTION_PLANS[plan].months
  const extras = Math.max(0, maxDevices - 1)
  const extraTotal = extras * EXTRA_DEVICE_MONTHLY_SOLES * months

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
          className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
        >
          <option value="">Selecciona un usuario</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} — {user.email}
            </option>
          ))}
        </select>
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
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
          {state.ok}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
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
