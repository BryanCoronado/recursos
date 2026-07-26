"use client"

import { useState, type FormEvent } from "react"
import { signIn } from "next-auth/react"
import { Loader2, LogIn } from "lucide-react"

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
      setError("Correo o contraseña incorrectos, o la cuenta no está habilitada.")
      setIsPending(false)
      return
    }

    window.location.assign(result.url ?? callbackUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[var(--mich-text)]"
        >
          Correo electrónico
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          className="h-11 border-[var(--mich-border)] bg-[var(--mich-surface-muted)] text-[var(--mich-text)] placeholder:text-[var(--mich-muted)]/60 focus-visible:border-[var(--mich-blue)]/60 focus-visible:ring-[var(--mich-blue)]/25"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[var(--mich-text)]"
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
          className="h-11 border-[var(--mich-border)] bg-[var(--mich-surface-muted)] text-[var(--mich-text)] placeholder:text-[var(--mich-muted)]/60 focus-visible:border-[var(--mich-blue)]/60 focus-visible:ring-[var(--mich-blue)]/25"
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
        className="h-11 w-full bg-gradient-to-r from-[var(--mich-blue)] to-[var(--mich-indigo)] text-white shadow-[0_12px_28px_-14px_var(--mich-glow)] hover:brightness-105"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  )
}
