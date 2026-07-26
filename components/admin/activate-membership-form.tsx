"use client"

import { useActionState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import {
  activateMembership,
  type MembershipActionState,
} from "@/app/(dashboard)/subscriptions/actions"
import { ProviderSelect } from "@/components/providers/provider-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  planTotalSoles,
} from "@/lib/billing/plans"

type UserOption = { id: string; name: string; email: string }

export function ActivateMembershipForm({ users }: { users: UserOption[] }) {
  const [state, action, pending] = useActionState(
    activateMembership,
    {} as MembershipActionState
  )

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
          Plan (S/ {MONTHLY_PRICE_SOLES}/mes)
        </label>
        <select
          id="plan"
          name="plan"
          required
          defaultValue="MONTHLY"
          className="h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm"
        >
          {(
            Object.keys(SUBSCRIPTION_PLANS) as Array<keyof typeof SUBSCRIPTION_PLANS>
          ).map((key) => {
            const plan = SUBSCRIPTION_PLANS[key]
            const total = planTotalSoles(key)
            return (
              <option key={key} value={key}>
                {plan.label} — S/ {total}
                {key !== "MONTHLY" ? " (descuento)" : ""}
              </option>
            )
          })}
        </select>
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
          "Activar membresía"
        )}
      </Button>
    </form>
  )
}
