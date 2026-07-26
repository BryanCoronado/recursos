"use client"

import { useActionState } from "react"
import { Loader2, Save } from "lucide-react"

import type { RoleActionState } from "@/app/(dashboard)/roles/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type PermissionOption = {
  id: string
  key: string
  module: string
  label: string
}

type RoleFormProps = {
  action: (state: RoleActionState, formData: FormData) => Promise<RoleActionState>
  permissions: PermissionOption[]
  role?: {
    id: string
    name: string
    description: string
    permissionIds: string[]
  }
}

export function RoleForm({ action, permissions, role }: RoleFormProps) {
  const [state, formAction, pending] = useActionState(action, {})
  const grouped = permissions.reduce((groups, permission) => {
    const current = groups.get(permission.module) ?? []
    current.push(permission)
    groups.set(permission.module, current)
    return groups
  }, new Map<string, PermissionOption[]>())

  return (
    <form action={formAction} className="space-y-5">
      {role ? <input type="hidden" name="roleId" value={role.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>
          <Input id="name" name="name" defaultValue={role?.name} required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción
          </label>
          <Input
            id="description"
            name="description"
            defaultValue={role?.description}
          />
        </div>
      </div>
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Permisos</legend>
        {[...grouped].map(([module, modulePermissions]) => (
          <div key={module} className="rounded-lg border bg-background p-4">
            <h3 className="mb-3 font-medium capitalize">{module}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {modulePermissions.map((permission) => (
                <label key={permission.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="permissionIds"
                    value={permission.id}
                    defaultChecked={role?.permissionIds.includes(permission.id)}
                    className="mt-1"
                  />
                  <span>
                    {permission.label}
                    <span className="block font-mono text-xs text-muted-foreground">
                      {permission.key}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        {pending ? "Guardando..." : "Guardar rol"}
      </Button>
    </form>
  )
}
