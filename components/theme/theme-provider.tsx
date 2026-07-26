"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "mich-theme"

type ThemeContextValue = {
  theme: ThemeMode
  resolved: "light" | "dark"
  setTheme: (theme: ThemeMode) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyTheme(theme: ThemeMode) {
  const dark = theme === "dark" || (theme === "system" && getSystemDark())
  document.documentElement.classList.toggle("dark", dark)
  return dark ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system")
  const [resolved, setResolved] = useState<"light" | "dark">("light")

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const initial =
      saved === "light" || saved === "dark" || saved === "system"
        ? saved
        : "system"
    setThemeState(initial)
    setResolved(applyTheme(initial) as "light" | "dark")
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      if (theme === "system") {
        setResolved(applyTheme("system") as "light" | "dark")
      }
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    setResolved(applyTheme(next) as "light" | "dark")
  }, [])

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ["light", "dark", "system"]
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider")
  }
  return ctx
}
