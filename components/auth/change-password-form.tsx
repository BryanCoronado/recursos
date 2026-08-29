"use client"

import { useActionState } from "react"
import { KeyRound, Loader2 } from "lucide-react"

import {
  changePassword,
  type PasswordActionState,
} from "@/app/(auth)/change-password/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const initialState: PasswordActionState = {}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialState)

  return (
    <form action={action} className="space-y-4">
      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="Contraseña actual"
        autoComplete="current-password"
        disabled={pending}
      />
      <PasswordField
        id="newPassword"
        name="newPassword"
        label="Nueva contraseña"
        autoComplete="new-password"
        disabled={pending}
      />
      <PasswordField
        id="confirmation"
        name="confirmation"
        label="Confirmar nueva contraseña"
        autoComplete="new-password"
        disabled={pending}
      />
      <p className="text-xs text-[var(--mich-muted)]">Usa al menos 8 caracteres.</p>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-xl"
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  )
}

type PasswordFieldProps = {
  id: string
  name: string
  label: string
  autoComplete: string
  disabled: boolean
}

function PasswordField(props: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={props.id}
        className="text-sm font-medium text-[var(--mich-text)]"
      >
        {props.label}
      </label>
      <Input
        {...props}
        type="password"
        required
        className="h-11 border-[var(--mich-border)] bg-[var(--mich-surface-muted)] text-[var(--mich-text)] placeholder:text-[var(--mich-muted)]/60 focus-visible:border-[var(--mich-blue)]/55 focus-visible:ring-[var(--mich-blue)]/25"
      />
    </div>
  )
}
