"use client"

import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowUpRight, CirclePlay, Maximize2, Minimize2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { youtubeEmbedId } from "@/lib/youtube"

type ProviderHelpPanelProps = {
  /** Si no hay video, el panel solo muestra los pasos */
  tutorialYoutubeUrl?: string
  browseUrl: string
  browseLabel: string
  providerLabel?: string
  align?: "center" | "start"
}

function defaultSteps(providerLabel: string) {
  return [
    {
      title: "Encuentra tu recurso",
      body: `Abre ${providerLabel} y busca lo que necesitas.`,
    },
    {
      title: "Copia el enlace",
      body: "Entra a la página del producto y copia la URL completa.",
    },
    {
      title: "Pégalo y descarga",
      body: "Vuelve aquí, pega el enlace en el campo y pulsa Descargar recurso.",
    },
    {
      title: "Recoge el archivo",
      body: "Cuando el estado pase a Completada, baja el archivo desde el historial.",
    },
  ] as const
}

export function ProviderHelpPanel({
  tutorialYoutubeUrl,
  browseUrl,
  browseLabel,
  providerLabel = "el proveedor",
  align = "start",
}: ProviderHelpPanelProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const titleId = useId()
  const videoId = tutorialYoutubeUrl
    ? youtubeEmbedId(tutorialYoutubeUrl)
    : null
  const steps = defaultSteps(providerLabel)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setExpanded(false)
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expanded) setExpanded(false)
        else setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, expanded])

  function closeAll() {
    setExpanded(false)
    setOpen(false)
  }

  const drawer =
    mounted &&
    createPortal(
      <>
        <div
          className={cn(
            "fixed inset-0 z-[120] bg-[#060b14]/60 backdrop-blur-md transition-opacity duration-300",
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          )}
          onClick={closeAll}
          aria-hidden={!open}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "fixed inset-y-0 right-0 z-[130] flex w-full flex-col border-l border-white/[0.08] bg-[#0a101c] text-white shadow-[-28px_0_80px_-24px_rgba(0,0,0,0.75)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "max-w-full sm:max-w-[28rem]",
            open ? "translate-x-0" : "translate-x-full",
            expanded && "sm:max-w-3xl"
          )}
        >
          <header className="relative flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 pb-4 pt-5 sm:px-6">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white/40">
                Tutorial
              </p>
              <h2
                id={titleId}
                className="mt-1.5 font-heading text-[1.3rem] font-semibold leading-none tracking-[-0.045em] sm:text-[1.4rem]"
              >
                Cómo descargar
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {videoId ? (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="hidden size-9 items-center justify-center rounded-full bg-white/[0.07] text-white/70 transition hover:bg-white/12 hover:text-white sm:flex"
                  aria-label={expanded ? "Reducir panel" : "Ampliar panel"}
                  title={expanded ? "Reducir" : "Ampliar"}
                >
                  {expanded ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeAll}
                className="flex size-9 items-center justify-center rounded-full bg-white/[0.07] text-white/70 transition hover:bg-white/12 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          <div className="relative flex-1 overflow-y-auto px-5 pb-8 pt-5 sm:px-6">
            {videoId ? (
              <>
                <div className="overflow-hidden rounded-xl bg-black ring-1 ring-white/[0.08]">
                  <div className="relative aspect-video">
                    {open ? (
                      <iframe
                        title={`Tutorial ${providerLabel}`}
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    ) : null}
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-white/35">
                  Usa pantalla completa del reproductor si quieres ver el video
                  más grande.
                </p>
              </>
            ) : null}

            <p className="mt-6 text-[13px] leading-6 text-white/50">
              Sigue estos pasos para descargar en {providerLabel}.
            </p>

            <ol className="mt-4 space-y-0">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-t border-white/[0.07] py-4 first:border-t-0 first:pt-0"
                >
                  <span className="flex size-8 items-center justify-center rounded-xl bg-white/[0.06] font-heading text-[12px] font-semibold tabular-nums text-[var(--mich-blue-bright)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="font-heading text-[15px] font-semibold leading-snug tracking-[-0.03em] text-white">
                      {step.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-6 text-white/55">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-left">
              <p className="text-[12px] font-medium text-white/40">
                Importante
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-white/60">
                {providerLabel} debe estar en{" "}
                <span className="text-white">Sync → Listo</span>. Si una
                descarga falla, abre el log en el historial.
              </p>
            </div>

            <a
              href={browseUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mich-blue)] text-[14px] font-medium text-white transition hover:brightness-110"
            >
              {browseLabel}
              <ArrowUpRight className="size-4 opacity-90" />
            </a>
          </div>
        </aside>
      </>,
      document.body
    )

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          align === "center" && "justify-center"
        )}
      >
        <a
          href={browseUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)] px-3 text-[13px] font-medium text-[var(--mich-blue-bright)] shadow-[var(--mich-shadow-soft)] transition hover:border-[var(--mich-blue)]/40 hover:bg-[var(--mich-blue)]/8"
        >
          {browseLabel}
          <ArrowUpRight className="size-3.5 stroke-[2.25]" aria-hidden />
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-[13px] font-medium text-[var(--mich-text)] transition hover:border-[var(--mich-blue)]/35 hover:bg-[var(--mich-blue)]/8"
        >
          <CirclePlay className="size-3.5 stroke-[2]" aria-hidden />
          Cómo usar
        </button>
      </div>
      {drawer}
    </>
  )
}
