"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type RevealVariant = "up" | "scale" | "left" | "right"

export function LandingReveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: {
  children: ReactNode
  className?: string
  delay?: number
  variant?: RevealVariant
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "mich-lp-reveal",
        `mich-lp-reveal-${variant}`,
        visible && "mich-lp-reveal-in",
        className
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}
