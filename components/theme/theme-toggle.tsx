"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LABELS = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
} as const

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, cycleTheme } = useTheme()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const Icon = !ready
    ? Monitor
    : theme === "dark"
      ? Moon
      : theme === "light"
        ? Sun
        : Monitor

  const label = ready ? LABELS[theme] : "Tema"

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon-sm" : "icon"}
      onClick={cycleTheme}
      aria-label={`Tema: ${label}. Cambiar tema`}
      title={`Tema: ${label}`}
      className={cn(
        "rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)]/80 text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-blue)]",
        !compact && "size-9"
      )}
    >
      <Icon className="size-4" />
    </Button>
  )
}
