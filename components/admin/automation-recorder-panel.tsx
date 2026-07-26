"use client"

import Link from "next/link"
import { useActionState, useEffect, useState, useTransition } from "react"
import {
  CircleStop,
  Download,
  Loader2,
  MousePointerClick,
  Save,
  Trash2,
  Video,
} from "lucide-react"

import {
  cancelAutomationRecording,
  getAutomationRecording,
  markNextClickAsDownload,
  saveRecordingAsRule,
  startAutomationRecording,
  stopAutomationRecording,
  type RecordingActionState,
} from "@/app/(dashboard)/automations/recording-actions"
import { ProviderSelect } from "@/components/providers/provider-select"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  PROVIDERS,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

type RecordingView = {
  status: "IDLE" | "RECORDING" | "STOPPED"
  name: string | null
  sampleUrl: string | null
  urlPattern: string | null
  nextClickIsDownload: boolean
  lastError: string | null
  steps: unknown
}

function providerFormData(provider: ResourceProviderId) {
  const fd = new FormData()
  fd.set("provider", provider)
  return fd
}

export function AutomationRecorderPanel({
  initial,
  provider: initialProvider,
}: {
  initial: RecordingView
  provider: ResourceProviderId
}) {
  const [provider, setProvider] = useState<ResourceProviderId>(initialProvider)
  const [recording, setRecording] = useState(initial)
  const [startState, startAction, startPending] = useActionState(
    startAutomationRecording,
    {} as RecordingActionState
  )
  const [saveState, saveAction, savePending] = useActionState(
    async (_prev: RecordingActionState, formData: FormData) =>
      saveRecordingAsRule(formData),
    {} as RecordingActionState
  )
  const [, startTransition] = useTransition()
  const def = PROVIDERS[provider]

  useEffect(() => {
    if (recording.status !== "RECORDING" && recording.status !== "STOPPED") {
      return
    }

    const timer = window.setInterval(() => {
      startTransition(async () => {
        const next = await getAutomationRecording(provider)
        if (!next) return
        setRecording({
          status: next.status,
          name: next.name,
          sampleUrl: next.sampleUrl,
          urlPattern: next.urlPattern,
          nextClickIsDownload: next.nextClickIsDownload,
          lastError: next.lastError,
          steps: next.steps,
        })
      })
    }, 1500)

    return () => window.clearInterval(timer)
  }, [recording.status, provider])

  useEffect(() => {
    if (startState.ok) {
      startTransition(async () => {
        const next = await getAutomationRecording(provider)
        if (!next) return
        setRecording({
          status: next.status,
          name: next.name,
          sampleUrl: next.sampleUrl,
          urlPattern: next.urlPattern,
          nextClickIsDownload: next.nextClickIsDownload,
          lastError: next.lastError,
          steps: next.steps,
        })
      })
    }
  }, [startState.ok, provider])

  const steps = Array.isArray(recording.steps) ? recording.steps : []
  const isBusy =
    recording.status === "RECORDING" || recording.status === "STOPPED"

  return (
    <div className="space-y-6">
      {!isBusy ? (
        <form action={startAction} className="space-y-4">
          <ProviderSelect
            name="provider"
            value={provider}
            onChange={setProvider}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre de la regla"
              name="name"
              placeholder="Flujo principal"
              required
            />
            <Field
              label="Patrón de ruta"
              name="urlPattern"
              placeholder="/ruta (auto si lo dejas vacío)"
            />
          </div>
          <Field
            label="URL de ejemplo para grabar"
            name="sampleUrl"
            type="url"
            placeholder={def.sampleUrlPlaceholder}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" name="category" defaultValue="default" />
            <Field
              label="Prioridad"
              name="priority"
              type="number"
              defaultValue="50"
            />
          </div>
          {(startState.error || recording.lastError) && (
            <p className="text-sm text-destructive">
              {startState.error || recording.lastError}
            </p>
          )}
          <Button type="submit" disabled={startPending}>
            {startPending ? <Loader2 className="animate-spin" /> : <Video />}
            Abrir navegador y grabar clics
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-4 text-sm">
            <p>
              Proveedor: <strong>{def.shortLabel}</strong> · Estado:{" "}
              <strong>{recording.status}</strong>
            </p>
            <p className="mt-1 text-[var(--mich-muted)]">
              {recording.name} · patrón <code>{recording.urlPattern}</code>
            </p>
            <p className="mt-2 text-[var(--mich-muted)]">
              En el Chromium del worker: navega y haz clic. Antes del botón de
              descarga, pulsa «Siguiente clic = descarga».
            </p>
            {recording.nextClickIsDownload ? (
              <p className="mt-2 font-medium text-[var(--mich-blue-bright)]">
                Esperando el clic de descarga…
              </p>
            ) : null}
            {recording.lastError ? (
              <p className="mt-2 text-destructive">{recording.lastError}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={recording.status !== "RECORDING"}
              onClick={() =>
                startTransition(async () => {
                  await markNextClickAsDownload(providerFormData(provider))
                })
              }
            >
              <Download />
              Siguiente clic = descarga
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={recording.status !== "RECORDING"}
              onClick={() =>
                startTransition(async () => {
                  await stopAutomationRecording(providerFormData(provider))
                  const next = await getAutomationRecording(provider)
                  if (next) {
                    setRecording({
                      status: next.status,
                      name: next.name,
                      sampleUrl: next.sampleUrl,
                      urlPattern: next.urlPattern,
                      nextClickIsDownload: next.nextClickIsDownload,
                      lastError: next.lastError,
                      steps: next.steps,
                    })
                  }
                })
              }
            >
              <CircleStop />
              Detener grabación
            </Button>
            <form action={saveAction}>
              <input type="hidden" name="provider" value={provider} />
              <Button type="submit" disabled={savePending || steps.length === 0}>
                {savePending ? <Loader2 className="animate-spin" /> : <Save />}
                Guardar como regla
              </Button>
            </form>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  await cancelAutomationRecording(providerFormData(provider))
                  setRecording({
                    status: "IDLE",
                    name: null,
                    sampleUrl: null,
                    urlPattern: null,
                    nextClickIsDownload: false,
                    lastError: null,
                    steps: [],
                  })
                })
              }
            >
              <Trash2 />
              Descartar
            </Button>
          </div>

          {saveState.error ? (
            <p className="text-sm text-destructive">{saveState.error}</p>
          ) : null}

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <MousePointerClick className="size-4" />
              Pasos grabados ({steps.length})
            </p>
            <ol className="space-y-2 rounded-2xl border border-[var(--mich-border)] p-3 font-mono text-xs">
              {steps.length === 0 ? (
                <li className="text-[var(--mich-muted)]">
                  Aún no hay clics. Interactúa en el navegador.
                </li>
              ) : (
                steps.map((step, index) => (
                  <li key={index} className="break-all text-[var(--mich-text)]">
                    {index + 1}. {JSON.stringify(step)}
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      )}

      <Link
        href="/automations"
        className={cn(buttonVariants({ variant: "ghost" }), "px-0")}
      >
        Volver a reglas
      </Link>
    </div>
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
