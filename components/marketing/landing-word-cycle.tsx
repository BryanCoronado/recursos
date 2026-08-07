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
        "mich-lp-word-cycle relative inline-flex h-[1.15em] min-w-[11.5ch] overflow-hidden align-bottom sm:min-w-[14ch]",
        className
      )}
      aria-live="polite"
    >
      <span
        key={ready ? index : 0}
        className={cn(
          "mich-lp-gradient-text inline-block whitespace-nowrap",
          ready && "mich-lp-word-in"
        )}
      >
        {WORDS[ready ? index : 0]}
      </span>
    </span>
  )
}
