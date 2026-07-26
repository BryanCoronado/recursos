"use client"

import { useActionState } from "react"
import { Loader2, Save } from "lucide-react"

import type { AutomationActionState } from "@/app/(dashboard)/automations/actions"
import { ProviderSelect } from "@/components/providers/provider-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AutomationRuleFormProps = {
  action: (
    state: AutomationActionState,
    formData: FormData
  ) => Promise<AutomationActionState>
  rule?: {
    id: string
    name: string
    category: string
    urlPattern: string
    priority: number
    isActive: boolean
    stepsJson: string
  }
  /** Solo al crear: permite elegir proveedor */
  showProviderSelect?: boolean
  defaultProvider?: "ENVATO" | "MAGNIFIC"
}

export function AutomationRuleForm({
  action,
  rule,
  showProviderSelect = false,
  defaultProvider = "ENVATO",
}: AutomationRuleFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4">
      {rule ? <input type="hidden" name="id" value={rule.id} /> : null}
      {showProviderSelect ? (
        <ProviderSelect name="provider" defaultValue={defaultProvider} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre"
          name="name"
          defaultValue={rule?.name ?? ""}
          required
        />
        <Field
          label="Categoría"
          name="category"
          defaultValue={rule?.category ?? "default"}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Patrón de URL"
          name="urlPattern"
          defaultValue={rule?.urlPattern ?? ""}
          placeholder="/free-files"
        />
        <Field
          label="Prioridad"
          name="priority"
          type="number"
          defaultValue={String(rule?.priority ?? 100)}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={rule?.isActive ?? true}
        />
        Regla activa
      </label>
      <div className="space-y-1.5">
        <label htmlFor="stepsJson" className="text-sm font-medium">
          Pasos (JSON)
        </label>
        <textarea
          id="stepsJson"
          name="stepsJson"
          required
          rows={12}
          defaultValue={
            rule?.stepsJson ??
            JSON.stringify(
              [
                { type: "wait", ms: 2500 },
                {
                  type: "download",
                  by: "css",
                  selector:
                    'button:has-text("Download"), button:has-text("Descargar")',
                  timeoutMs: 120000,
                },
              ],
              null,
              2
            )
          }
          className="w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-3 font-mono text-xs"
        />
        <p className="text-xs text-[var(--mich-muted)]">
          Tipos: wait, waitFor, click, download. Selectores: css o xpath.
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        Guardar regla
      </Button>
    </form>
  )
}

function Field({
  label,
  ...props
}: React.ComponentProps<"input"> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={props.name} className="text-sm font-medium">
        {label}
      </label>
      <Input id={props.name} {...props} />
    </div>
  )
}
