"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const WORDS = ["Envato Elements", "Magnific"] as const

/** Rotador de palabras: SSR y primer paint muestran la misma palabra. */
export function LandingWordCycle({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length)
    }, 2800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span
      className={cn(
          "mich-lp-word-cycle relative inline-flex h-[1.15em] min-w-[12ch] overflow-hidden align-bottom text-[var(--mich-blue-bright)] sm:min-w-[15ch]",
        className
      )}
      aria-live="polite"
    >
      <span
        key={ready ? index : 0}
        className={cn(
          "inline-block whitespace-nowrap",
          ready && "mich-lp-word-in"
        )}
      >
        {WORDS[ready ? index : 0]}
      </span>
    </span>
  )
}
