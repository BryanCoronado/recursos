"use client"

import { useActionState, useMemo, useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

import {
  completeProfile,
  type CompleteProfileState,
} from "@/app/(auth)/complete-profile/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { COUNTRIES, getCountry } from "@/lib/geo/countries"

export function CompleteProfileForm({
  defaultCountry = "PE",
}: {
  defaultCountry?: string
}) {
  const [state, formAction, pending] = useActionState(
    completeProfile,
    {} as CompleteProfileState
  )
  const [country, setCountry] = useState(defaultCountry)
  const dial = useMemo(() => getCountry(country)?.dial ?? "", [country])

  const fieldClass =
    "h-12 rounded-2xl border-[var(--mich-border)] bg-[var(--mich-surface)]/80 text-[var(--mich-text)] shadow-none placeholder:text-[var(--mich-muted)]/50 focus-visible:border-[var(--mich-blue)]/55 focus-visible:ring-[var(--mich-blue)]/20"

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="country"
          className="text-[13px] font-medium text-[var(--mich-text)]"
        >
          País
        </label>
        <select
          id="country"
          name="country"
          required
          disabled={pending}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={fieldClass + " w-full px-3"}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
              {c.dial ? ` (+${c.dial})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="phone"
          className="text-[13px] font-medium text-[var(--mich-text)]"
        >
          Celular / WhatsApp
        </label>
        <div className="relative">
          {dial ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[var(--mich-muted)]">
              +{dial}
            </span>
          ) : null}
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            disabled={pending}
            placeholder={dial ? "917080235" : "Código + número"}
            className={fieldClass + (dial ? " pl-14" : "")}
          />
        </div>
        <p className="text-[12px] text-[var(--mich-muted)]">
          Lo usamos para soporte y activar tu membresía. Es obligatorio.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="group h-12 w-full rounded-2xl bg-[var(--mich-text)] text-[15px] font-semibold text-[var(--mich-surface)] dark:bg-white dark:text-[#0b1220]"
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Guardar y continuar
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  )
}
