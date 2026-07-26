"use client"

import { useActionState } from "react"
import { KeyRound, Loader2 } from "lucide-react"

import {
  resetUserPassword,
  type UserActionState,
} from "@/app/(dashboard)/users/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<UserActionState, FormData>(
    resetUserPassword,
    {}
  )

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <div className="space-y-1.5">
        <label htmlFor="reset-password" className="text-sm font-medium">
          Nueva contraseña temporal
        </label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          minLength={12}
          required
          disabled={pending}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
        Restablecer contraseña
      </Button>
    </form>
  )
}
