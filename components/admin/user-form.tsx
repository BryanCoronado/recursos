"use client"

import { useActionState } from "react"
import { Loader2, Save } from "lucide-react"

import type { UserActionState } from "@/app/(dashboard)/users/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type RoleOption = {
  id: string
  name: string
  description: string | null
}

type UserFormProps = {
  action: (state: UserActionState, formData: FormData) => Promise<UserActionState>
  roles: RoleOption[]
  user?: {
    id: string
    name: string
    email: string
    roleIds: string[]
  }
}

export function UserForm({ action, roles, user }: UserFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-5">
      {user ? <input type="hidden" name="userId" value={user.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="name" defaultValue={user?.name} />
        <Field
          label="Correo"
          name="email"
          type="email"
          defaultValue={user?.email}
        />
      </div>
      {!user ? (
        <Field
          label="Contraseña temporal"
          name="password"
          type="password"
          minLength={12}
        />
      ) : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Roles</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer gap-3 rounded-lg border bg-background p-3"
            >
              <input
                type="checkbox"
                name="roleIds"
                value={role.id}
                defaultChecked={user?.roleIds.includes(role.id)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">{role.name}</span>
                {role.description ? (
                  <span className="text-xs text-muted-foreground">
                    {role.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        {pending ? "Guardando..." : "Guardar usuario"}
      </Button>
    </form>
  )
}

type FieldProps = {
  label: string
  name: string
  type?: string
  defaultValue?: string
  minLength?: number
}

function Field({ label, ...props }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={props.name} className="text-sm font-medium">
        {label}
      </label>
      <Input id={props.name} required {...props} />
    </div>
  )
}
