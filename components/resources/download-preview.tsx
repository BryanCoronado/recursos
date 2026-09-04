"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

/** Ritmo de refresco; el worker captura cada ~1.5 s. */
const REFRESH_MS = 1200
const RETRY_MS = 2000

/**
 * Muestra la pestaña del worker que está haciendo ESTA descarga, como una
 * secuencia de capturas. No es interactivo a propósito.
 */
export function DownloadPreview({ jobId }: { jobId: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
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
  }, [jobId])

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--mich-surface-muted)] p-3">
      {src ? (
        // Ruta dinámica con no-store: next/image no aporta nada aquí.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Vista en vivo de tu descarga"
          className="max-h-full max-w-full rounded-lg object-contain shadow-[var(--mich-shadow-page)]"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-sm text-[var(--mich-muted)]">
          <Loader2 className="size-5 animate-spin text-[var(--mich-blue)]" />
          {failed ? "Preparando la vista…" : "Conectando…"}
        </div>
      )}
    </div>
  )
}
