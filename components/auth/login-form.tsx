"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl,
      redirect: false,
    })

    if (!result?.ok) {
      setError(
        "Correo o contraseña incorrectos, o la cuenta no está habilitada."
      )
      setIsPending(false)
      return
    }

    window.location.assign(result.url ?? callbackUrl)
  }

  const fieldClass =
    "h-12 rounded-2xl border-[var(--mich-border)] bg-[var(--mich-surface)]/80 text-[var(--mich-text)] shadow-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-[var(--mich-muted)]/50 focus-visible:border-[var(--mich-blue)]/55 focus-visible:bg-[var(--mich-surface)] focus-visible:ring-[var(--mich-blue)]/25 focus-visible:shadow-[0_0_0_4px_var(--mich-glow)]"

  return (
    <form onSubmit={handleSubmit} className="mich-auth-stagger space-y-5">
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
          disabled={isPending}
          placeholder="tu@correo.com"
          className={fieldClass}
        />
      </div>
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
          autoComplete="current-password"
          required
          disabled={isPending}
          placeholder="••••••••"
          className={fieldClass}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="group relative h-12 w-full overflow-hidden rounded-2xl bg-[var(--mich-text)] text-[15px] font-semibold text-[var(--mich-surface)] transition-[transform,box-shadow] duration-300 hover:bg-[var(--mich-text)]/90 hover:shadow-[0_12px_40px_-16px_var(--mich-glow)] active:scale-[0.98] dark:bg-white dark:text-[#0b1220] dark:hover:bg-white/90"
        disabled={isPending}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-black/10"
        />
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Entrar
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
      <p className="pt-1 text-center text-[13px] text-[var(--mich-muted)]">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-semibold text-[var(--mich-blue-bright)] underline-offset-4 transition-colors hover:text-[var(--mich-blue)] hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}
