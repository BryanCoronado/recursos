"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "#envato", label: "Envato" },
  { href: "#magnific", label: "Magnific" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#planes", label: "Planes" },
  { href: "#faq", label: "FAQ" },
] as const

export function LandingNav({
  loggedIn,
  appHref,
}: {
  loggedIn: boolean
  appHref: string
}) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--mich-border)] bg-[var(--mich-surface)]/85 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo width={40} height={40} className="size-9" priority />
          <span className="font-heading text-[15px] font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
            MICHITECH
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--mich-muted)] transition hover:bg-[var(--mich-blue)]/8 hover:text-[var(--mich-text)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          {loggedIn ? (
            <Link
              href={appHref}
              className={cn(buttonVariants({ size: "sm" }), "hidden rounded-xl sm:inline-flex")}
            >
              Ir al panel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden rounded-xl text-[var(--mich-muted)] sm:inline-flex"
                )}
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "sm" }), "hidden rounded-xl sm:inline-flex")}
              >
                Crear cuenta
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-xl border border-[var(--mich-border)] text-[var(--mich-muted)] md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--mich-border)] bg-[var(--mich-surface)] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2.5 text-sm text-[var(--mich-text)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {loggedIn ? (
              <Link
                href={appHref}
                className={cn(buttonVariants(), "rounded-xl")}
                onClick={() => setOpen(false)}
              >
                Ir al panel
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants(), "rounded-xl")}
                  onClick={() => setOpen(false)}
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
