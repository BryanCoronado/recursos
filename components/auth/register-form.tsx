"use client"

import { useActionState, useMemo, useState } from "react"
import Image from "next/image"
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
    "h-11 rounded-xl border-[var(--mich-border)] bg-[var(--mich-surface)] text-[var(--mich-text)] shadow-none placeholder:text-[var(--mich-muted)]/50 focus-visible:border-[var(--mich-blue)]/55 focus-visible:ring-[var(--mich-blue)]/25"

  return (
    <form action={formAction} className="mich-auth-stagger space-y-4">
      <input type="hidden" name="providers" value="ENVATO" />

      <div className="flex items-center gap-3 rounded-xl border border-[var(--mich-blue)]/35 bg-[var(--mich-surface-muted)] p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-1.5">
          <Image
            src="/envato.png"
            alt=""
            width={24}
            height={24}
            unoptimized
            className="size-6 object-contain"
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--mich-text)]">
            Envato Elements
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--mich-muted)]">
            Panel y cupo gratis listos. Magnific se habilitará más adelante.
          </p>
        </div>
      </div>

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
        className="mt-1 h-11 w-full rounded-2xl text-[15px]"
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Crear cuenta
            <ArrowRight className="size-4" />
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
