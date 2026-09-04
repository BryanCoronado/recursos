"use client"

import { useEffect, useRef, useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Ritmo de refresco; el worker captura cada ~1.5 s. */
const REFRESH_MS = 1200
const RETRY_MS = 2000

/**
 * Muestra la pestaña del worker que está haciendo ESTA descarga, como una
 * secuencia de capturas. No es interactivo a propósito.
 */
export function DownloadPreview({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    // Precargamos fuera del DOM y recién ahí cambiamos el src: si apuntáramos
    // el <img> directo a cada URL nueva, parpadearía en blanco entre frames.
    const load = () => {
      const url = `/api/downloads/${jobId}/preview?t=${Date.now()}`
      const image = new window.Image()

      image.onload = () => {
        if (cancelled) return
        setSrc(url)
        setFailed(false)
        timerRef.current = window.setTimeout(load, REFRESH_MS)
      }

      image.onerror = () => {
        if (cancelled) return
        setFailed(true)
        timerRef.current = window.setTimeout(load, RETRY_MS)
      }

      image.src = url
    }

    load()

    return () => {
      cancelled = true
      window.clearTimeout(timerRef.current)
    }
  }, [jobId, open])

  useEffect(() => {
    if (open) return
    setSrc(null)
    setFailed(false)
  }, [open])

  return (
    <div className="mt-4">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen((value) => !value)}
        className="rounded-xl"
      >
        {open ? <EyeOff /> : <Eye />}
        {open ? "Ocultar descarga" : "Ver descarga"}
      </Button>

      {open ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)]">
          <div className="relative aspect-[1360/900] w-full">
            {src ? (
              // Ruta dinámica con no-store: next/image no aporta nada aquí.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt="Vista en vivo de tu descarga"
                className="absolute inset-0 size-full object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-[var(--mich-muted)]">
                <Loader2 className="size-5 animate-spin text-[var(--mich-blue)]" />
                {failed ? "Preparando la vista…" : "Conectando…"}
              </div>
            )}
          </div>
          <p className="border-t border-[var(--mich-border)] px-3 py-2 text-[11px] text-[var(--mich-muted)]">
            Vista en vivo de tu descarga. Es solo visual: no hace falta que
            hagas nada aquí.
          </p>
        </div>
      ) : null}
    </div>
  )
}
