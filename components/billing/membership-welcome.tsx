"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PartyPopper, X } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { getProvider, type ResourceProviderId } from "@/lib/providers/catalog"
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

export type MembershipWelcomeItem = {
  id: string
  provider: ResourceProviderId
  plan: SubscriptionPlanKey
  endsAt: string
  createdAt: string
}

function dismissKey(id: string) {
  return `mich-membership-welcome-${id}`
}

export function MembershipWelcomeBanner({
  items,
}: {
  items: MembershipWelcomeItem[]
}) {
  const [visible, setVisible] = useState<MembershipWelcomeItem | null>(null)

  useEffect(() => {
    const next = items.find((item) => {
      try {
        return window.localStorage.getItem(dismissKey(item.id)) !== "1"
      } catch {
        return true
      }
    })
    setVisible(next ?? null)
  }, [items])

  if (!visible) return null

  const def = getProvider(visible.provider)
  const planLabel = SUBSCRIPTION_PLANS[visible.plan]?.label ?? visible.plan

  function dismiss() {
    try {
      window.localStorage.setItem(dismissKey(visible!.id), "1")
    } catch {
      // ignore
    }
    setVisible(null)
  }

  return (
    <div
      role="status"
      className="mich-welcome-banner relative mb-5 overflow-hidden rounded-[1.35rem] border border-[color-mix(in_srgb,var(--mich-success)_35%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--mich-success)_14%,transparent),color-mix(in_srgb,var(--mich-blue)_10%,transparent))] px-4 py-4 shadow-[0_20px_44px_-32px_var(--mich-glow)] sm:px-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-[var(--mich-success)]/15 blur-2xl"
      />
      <div className="relative flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] text-[var(--mich-success)] shadow-sm">
          <PartyPopper className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold tracking-[-0.02em] text-[var(--mich-text)] sm:text-[15px]">
            ¡Tu membresía {def.shortLabel} está lista!
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[var(--mich-muted)]">
            Plan {planLabel} activo hasta{" "}
            {new Date(visible.endsAt).toLocaleDateString("es")}. Ya puedes
            descargar sin límite de cupo gratis.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={def.dashboardPath}
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-xl"
              )}
            >
              Ir a {def.shortLabel}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl text-[var(--mich-muted)]"
              )}
            >
              Entendido
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1 text-[var(--mich-muted)] hover:bg-[var(--mich-surface)]/60 hover:text-[var(--mich-text)]"
          aria-label="Cerrar aviso"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
