"use client"

import { useState } from "react"
import { CreditCard, Plus, X } from "lucide-react"

import { ActivateMembershipForm } from "@/components/admin/activate-membership-form"
import type { PickerUser } from "@/components/admin/user-picker"
import { Button } from "@/components/ui/button"

export function NewMembershipPanel({
  users,
  defaultOpen = false,
}: {
  users: PickerUser[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!open) {
    return (
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        className="h-11 rounded-xl"
      >
        <Plus />
        Nueva membresía
      </Button>
    )
  }

  return (
    <section className="mich-page-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-[var(--mich-blue)]" />
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
              Activar membresía
            </h2>
            <p className="text-xs text-[var(--mich-muted)]">
              Busca al cliente, elige plan y dispositivos.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ActivateMembershipForm users={users} />
    </section>
  )
}
