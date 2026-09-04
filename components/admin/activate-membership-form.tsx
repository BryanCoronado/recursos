"use client"

import Image from "next/image"
import { useActionState, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

import {
  activateMembership,
  type MembershipActionState,
} from "@/app/(dashboard)/subscriptions/actions"
import { UserPicker, type PickerUser } from "@/components/admin/user-picker"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  EXTRA_DEVICE_MONTHLY_SOLES,
  MAX_DEVICES,
  MIN_DEVICES,
  SUBSCRIPTION_PLANS,
  membershipTotalSoles,
  planPerMonthSoles,
  planSavingsSoles,
  type SubscriptionPlanKey,
} from "@/lib/billing/plans"
import {
  PROVIDERS,
  RESOURCE_PROVIDERS,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

const PLAN_KEYS = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanKey[]

export function ActivateMembershipForm({ users }: { users: PickerUser[] }) {
  const [state, action, pending] = useActionState(
    activateMembership,
    {} as MembershipActionState
  )
  const [provider, setProvider] = useState<ResourceProviderId>("ENVATO")
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
  const endsAt = useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + months)
    return date
  }, [months])

  const alreadyActive = Boolean(
    selected?.activeProviders?.includes(PROVIDERS[provider].shortLabel)
  )

  useEffect(() => {
    if (state.ok) {
      toast.success("Membresía activada", { description: state.ok })
      setUserId("")
      setMaxDevices(1)
    }
    if (state.error) {
      toast.error("No se pudo activar", { description: state.error })
    }
  }, [state.ok, state.error, state.membershipId])

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--mich-text)]">
          Cliente
        </label>
        <UserPicker
          users={users}
          value={userId}
          onChange={setUserId}
          disabled={pending}
        />
        {selected && !selected.phone ? (
          <p className="flex items-start gap-1.5 text-xs text-[var(--mich-warning)]">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            Sin celular en el perfil: no podrás avisar por WhatsApp
            automáticamente.
          </p>
        ) : null}
        {alreadyActive ? (
          <p className="flex items-start gap-1.5 text-xs text-[var(--mich-warning)]">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            Ya tiene una membresía activa de{" "}
            {PROVIDERS[provider].shortLabel}. Al activar otra se reemplaza la
            vigencia.
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--mich-text)]">
          Proveedor
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {RESOURCE_PROVIDERS.map((id) => {
            const item = PROVIDERS[id]
            const active = provider === id
            return (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "border-[var(--mich-blue)]/55 bg-[var(--mich-blue)]/8"
                    : "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] hover:border-[var(--mich-blue)]/35"
                )}
              >
                <input
                  type="radio"
                  name="provider"
                  value={id}
                  checked={active}
                  onChange={() => setProvider(id)}
                  disabled={pending}
                  className="sr-only"
                />
                <Image
                  src={item.logoSrc}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                  className="size-6 object-contain"
                />
                <span className="font-medium text-[var(--mich-text)]">
                  {item.shortLabel}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--mich-text)]">
          Plan
        </label>
        <input type="hidden" name="plan" value={plan} />
        <div className="grid gap-2 sm:grid-cols-3">
          {PLAN_KEYS.map((key) => {
            const item = SUBSCRIPTION_PLANS[key]
            const active = plan === key
            const save = planSavingsSoles(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlan(key)}
                disabled={pending}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-[var(--mich-blue)]/55 bg-[var(--mich-blue)]/8"
                    : "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] hover:border-[var(--mich-blue)]/35"
                )}
              >
                <span className="block text-sm font-semibold text-[var(--mich-text)]">
                  {item.label}
                </span>
                <span className="mt-0.5 block font-heading text-lg font-semibold text-[var(--mich-text)]">
                  S/ {item.totalSoles}
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--mich-muted)]">
                  ≈ S/ {planPerMonthSoles(key)}/mes
                  {save > 0 ? ` · ahorra S/ ${save}` : ""}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--mich-text)]">
          Dispositivos
        </label>
        <input type="hidden" name="maxDevices" value={maxDevices} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending || maxDevices <= MIN_DEVICES}
              onClick={() => setMaxDevices((n) => Math.max(MIN_DEVICES, n - 1))}
              aria-label="Quitar dispositivo"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="min-w-9 text-center font-heading text-base font-semibold tabular-nums text-[var(--mich-text)]">
              {maxDevices}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending || maxDevices >= MAX_DEVICES}
              onClick={() => setMaxDevices((n) => Math.min(MAX_DEVICES, n + 1))}
              aria-label="Agregar dispositivo"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <p className="text-xs text-[var(--mich-muted)]">
            1 incluido · extra +S/ {EXTRA_DEVICE_MONTHLY_SOLES}/mes
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="notes"
          className="text-sm font-medium text-[var(--mich-text)]"
        >
          Notas (opcional)
        </label>
        <Input
          id="notes"
          name="notes"
          disabled={pending}
          placeholder="Pago Yape, transferencia…"
          className="h-11 rounded-xl"
        />
      </div>

      <div className="rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--mich-muted)]">
              Total a cobrar
            </p>
            <p className="font-heading text-2xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
              S/ {total}
            </p>
          </div>
          <div className="text-right text-xs leading-5 text-[var(--mich-muted)]">
            <p>
              Plan S/ {SUBSCRIPTION_PLANS[plan].totalSoles}
              {extraTotal > 0 ? ` + disp. S/ ${extraTotal}` : ""}
            </p>
            <p>Vence {endsAt.toLocaleDateString("es")}</p>
          </div>
        </div>
      </div>

      {state.ok ? (
        <div className="space-y-3 rounded-xl border border-[color-mix(in_srgb,var(--mich-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_10%,transparent)] px-4 py-3">
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

      <Button
        type="submit"
        size="lg"
        disabled={pending || !userId}
        className="h-11 w-full rounded-xl"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Activando…
          </>
        ) : (
          `Activar ${PROVIDERS[provider].shortLabel} · S/ ${total}`
        )}
      </Button>
      {!userId ? (
        <p className="text-center text-xs text-[var(--mich-muted)]">
          Elige un cliente para continuar.
        </p>
      ) : null}
    </form>
  )
}
