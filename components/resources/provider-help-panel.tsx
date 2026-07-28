"use client"

import { useEffect, useId, useState } from "react"
import { ArrowUpRight, CirclePlay, Maximize2, Minimize2, X } from "lucide-react"

import { cn } from "@/lib/utils"

type ProviderHelpPanelProps = {
  tutorialYoutubeUrl: string
  browseUrl: string
  browseLabel: string
}

const USAGE_STEPS = [
  {
    title: "Encuentra tu recurso",
    body: "Abre Envato Elements y busca lo que necesitas (plantilla, música, gráfico, etc.).",
  },
  {
    title: "Copia el enlace",
    body: "Entra a la página del producto y copia la URL. Debe empezar por elements.envato.com.",
  },
  {
    title: "Pégalo y descarga",
    body: "Vuelve aquí, pega el enlace en el campo y pulsa Descargar recurso.",
  },
  {
    title: "Recoge el archivo",
    body: "Cuando el estado pase a Completada, baja el ZIP desde el historial de abajo.",
  },
] as const

function youtubeEmbedId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").split("/")[0] || null
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v")
    }
    const embed = parsed.pathname.match(/\/embed\/([^/?]+)/)
    return embed?.[1] ?? null
  } catch {
    return null
  }
}

export function ProviderHelpPanel({
  tutorialYoutubeUrl,
  browseUrl,
  browseLabel,
}: ProviderHelpPanelProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const titleId = useId()
  const videoId = youtubeEmbedId(tutorialYoutubeUrl)

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

  return (
    <>
      <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <a
          href={browseUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--mich-blue-bright)] transition hover:opacity-75"
        >
          {browseLabel}
          <ArrowUpRight className="size-3.5 stroke-[2.25]" aria-hidden />
        </a>
        <span className="h-3 w-px bg-[var(--mich-border)]" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--mich-muted)] transition hover:text-[var(--mich-text)]"
        >
          <CirclePlay className="size-3.5 stroke-[2]" aria-hidden />
          Cómo usar
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-[#060b14]/55 backdrop-blur-sm transition-opacity duration-300",
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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[#0a101c] text-white shadow-[-32px_0_80px_-40px_rgba(0,0,0,0.7)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "max-w-full sm:max-w-[26rem]",
          open ? "translate-x-0" : "translate-x-full",
          expanded && "sm:max-w-3xl"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top_right,rgba(93,156,236,0.22),transparent_60%)]"
        />

        <header className="relative flex items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
              Tutorial
            </p>
            <h2
              id={titleId}
              className="mt-1.5 font-heading text-[1.25rem] font-semibold leading-none tracking-[-0.045em] sm:text-[1.35rem]"
            >
              Cómo descargar
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="hidden size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white sm:flex"
              aria-label={expanded ? "Reducir panel" : "Ampliar panel"}
              title={expanded ? "Reducir" : "Ampliar"}
            >
              {expanded ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={closeAll}
              className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-y-auto px-4 pb-8 pt-3 sm:px-6 sm:pt-4">
          {videoId ? (
            <div className="overflow-hidden rounded-2xl bg-black shadow-[0_20px_40px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.08]">
              <div className="relative aspect-video">
                {open ? (
                  <iframe
                    title="Tutorial Envato"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="mt-2 text-center text-[11px] text-white/35 sm:text-left">
            Usa el icono de pantalla completa del reproductor para ver el video
            más grande.
          </p>

          <p className="mt-5 text-[13px] leading-6 text-white/50">
            Sigue estos pasos. El video muestra el flujo completo.
          </p>

          <ol className="mt-4 space-y-0">
            {USAGE_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 border-t border-white/[0.07] py-4 first:border-t-0 first:pt-0"
              >
                <span className="pt-0.5 font-heading text-[13px] font-semibold tabular-nums tracking-tight text-[var(--mich-blue-bright)]">
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

          <div className="mt-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/35">
              Importante
            </p>
            <p className="mt-1.5 text-[13px] leading-6 text-white/60">
              Envato debe estar en{" "}
              <span className="text-white">Sync → Listo</span>. Si una descarga
              falla, abre el log en el historial.
            </p>
          </div>

          <a
            href={browseUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mich-blue)] text-[14px] font-semibold tracking-[-0.02em] text-white transition hover:brightness-110"
          >
            {browseLabel}
            <ArrowUpRight className="size-4 opacity-90" />
          </a>
        </div>
      </aside>
    </>
  )
}
