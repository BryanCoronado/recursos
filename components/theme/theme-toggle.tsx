"use client"

import { Monitor, Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme/theme-provider"
import { Button } from "@/components/ui/button"

const LABELS = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
} as const

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, cycleTheme } = useTheme()

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon-sm" : "icon"}
      onClick={cycleTheme}
      aria-label={`Tema: ${LABELS[theme]}. Cambiar tema`}
      title={`Tema: ${LABELS[theme]}`}
      className="text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-blue-bright)]"
    >
      <Icon />
    </Button>
  )
}
