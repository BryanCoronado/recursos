"use client"

import { useActionState, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"

import {
  registerClient,
  type RegisterActionState,
} from "@/app/(auth)/register/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { COUNTRIES, getCountry } from "@/lib/geo/countries"

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerClient,
    {} as RegisterActionState
  )
  const [country, setCountry] = useState("PE")

  const dial = useMemo(() => getCountry(country)?.dial ?? "", [country])

  const fieldClass =
    "h-12 rounded-2xl border-[var(--mich-border)] bg-[var(--mich-surface)]/80 text-[var(--mich-text)] shadow-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-[var(--mich-muted)]/50 focus-visible:border-[var(--mich-blue)]/55 focus-visible:bg-[var(--mich-surface)] focus-visible:ring-[var(--mich-blue)]/25 focus-visible:shadow-[0_0_0_4px_var(--mich-glow)]"

  return (
    <form action={formAction} className="mich-auth-stagger space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-[13px] font-medium text-[var(--mich-text)]"
        >
          Nombre
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          disabled={pending}
          placeholder="Tu nombre"
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-[13px] font-medium text-[var(--mich-text)]"
        >
          Correo
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="tu@correo.com"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-[13px] font-medium text-[var(--mich-text)]"
          >
            Contraseña
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            placeholder="Mín. 8 caracteres"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-[13px] font-medium text-[var(--mich-text)]"
          >
            Confirmar
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            placeholder="Repite la clave"
            className={fieldClass}
          />
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-[var(--mich-text)] text-[15px] font-semibold text-[var(--mich-surface)] transition-[transform,box-shadow] duration-300 hover:bg-[var(--mich-text)]/90 hover:shadow-[0_12px_40px_-16px_var(--mich-glow)] active:scale-[0.98] dark:bg-white dark:text-[#0b1220] dark:hover:bg-white/90"
        disabled={pending}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-black/10"
        />
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Crear cuenta
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </>
        )}
      </Button>

      <p className="pt-1 text-center text-[13px] text-[var(--mich-muted)]">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--mich-blue-bright)] underline-offset-4 transition-colors hover:text-[var(--mich-blue)] hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
