"use client"

import { useEffect, useId, useState } from "react"
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Monitor,
  RefreshCw,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PanelMode = "minimized" | "docked" | "expanded"

type NovncPanelProps = {
  /** URL del visor (ya con autoconnect). */
  viewerUrl: string
  /** Si true, abre en modo docked al montar / cuando pase a true. */
  autoOpen?: boolean
  title?: string
  className?: string
}

export function NovncPanel({
  viewerUrl,
  autoOpen = false,
  title = "Escritorio del worker",
  className,
}: NovncPanelProps) {
  const titleId = useId()
  const [mode, setMode] = useState<PanelMode>(autoOpen ? "docked" : "minimized")
  const [frameKey, setFrameKey] = useState(0)

  useEffect(() => {
    if (autoOpen) setMode((m) => (m === "minimized" ? "docked" : m))
  }, [autoOpen])

  useEffect(() => {
    if (mode !== "expanded") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode("docked")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode])

  const iframe = (
    <iframe
      key={frameKey}
      title={title}
      src={viewerUrl}
      className="h-full w-full border-0 bg-[#1a2740]"
      allow="clipboard-read; clipboard-write"
      referrerPolicy="no-referrer"
    />
  )

  if (mode === "minimized") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] px-4 py-3 shadow-sm",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--mich-text)]">
          <Monitor className="size-4 shrink-0 text-[var(--mich-blue)]" />
          <span className="truncate font-medium">{title}</span>
          <span className="hidden text-[var(--mich-muted)] sm:inline">
            · minimizado
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMode("docked")}
          >
            <Maximize2 className="size-4" />
            Mostrar
          </Button>
        </div>
      </div>
    )
  }

  if (mode === "expanded") {
    return (
      <div
        className="fixed inset-0 z-[80] flex flex-col bg-[var(--mich-black)]/70 p-2 backdrop-blur-sm sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] shadow-2xl">
          <Toolbar
            titleId={titleId}
            title={title}
            viewerUrl={viewerUrl}
            onReload={() => setFrameKey((k) => k + 1)}
            onMinimize={() => setMode("minimized")}
            onDock={() => setMode("docked")}
            onClose={() => setMode("minimized")}
            expanded
          />
          <div className="min-h-0 flex-1 bg-black">{iframe}</div>
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] shadow-[0_18px_40px_-32px_rgba(11,18,32,0.4)]",
        className
      )}
    >
      <Toolbar
        titleId={titleId}
        title={title}
        viewerUrl={viewerUrl}
        onReload={() => setFrameKey((k) => k + 1)}
        onMinimize={() => setMode("minimized")}
        onExpand={() => setMode("expanded")}
        onClose={() => setMode("minimized")}
      />
      <div className="h-[min(58vh,560px)] w-full bg-black">{iframe}</div>
      <p className="border-t border-[var(--mich-border)] px-4 py-2 text-[11px] leading-relaxed text-[var(--mich-muted)]">
        URL del iframe: <code className="break-all">{viewerUrl}</code>
        <br />
        Si la web es HTTPS y el VNC es HTTP (IP:6080), el navegador bloquea el
        iframe (queda negro). Usa proxy Nginx{" "}
        <code>/vnc/</code> en el mismo dominio HTTPS, o abre VNC en pestaña
        nueva.
      </p>
    </section>
  )
}

function Toolbar({
  titleId,
  title,
  viewerUrl,
  onReload,
  onMinimize,
  onExpand,
  onDock,
  onClose,
  expanded,
}: {
  titleId: string
  title: string
  viewerUrl: string
  onReload: () => void
  onMinimize: () => void
  onExpand?: () => void
  onDock?: () => void
  onClose: () => void
  expanded?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Monitor className="size-4 shrink-0 text-[var(--mich-blue)]" />
        <h2
          id={titleId}
          className="truncate text-sm font-semibold text-[var(--mich-text)]"
        >
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Recargar escritorio"
          onClick={onReload}
        >
          <RefreshCw className="size-4" />
        </Button>
        <a
          href={viewerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex size-7 items-center justify-center rounded-lg text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-text)]"
          aria-label="Abrir en pestaña nueva"
        >
          <ExternalLink className="size-4" />
        </a>
        {expanded ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Reducir"
            onClick={onDock}
          >
            <Minimize2 className="size-4" />
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Minimizar"
              onClick={onMinimize}
            >
              <Minimize2 className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Maximizar"
              onClick={onExpand}
            >
              <Maximize2 className="size-4" />
            </Button>
          </>
        )}
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Cerrar panel"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
