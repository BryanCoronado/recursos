"use client"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isAuthorizationError =
    error.name === "AuthorizationError" ||
    error.message.includes("No tienes permiso")

  if (isAuthorizationError) {
    return <AccessDenied />
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-20 text-center">
      <div>
        <h1 className="font-heading text-xl font-semibold text-[var(--mich-text)]">
          No se pudo completar la operación
        </h1>
        <p className="mt-1 text-sm text-[var(--mich-muted)]">
          Puede que los datos hayan cambiado. Intenta de nuevo.
        </p>
      </div>
      <button
        type="button"
        className={buttonVariants({ variant: "outline" })}
        onClick={reset}
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
