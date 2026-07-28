import type { ReactNode } from "react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { ThemeToggle } from "@/components/theme/theme-toggle"

type AuthShellProps = {
  children: ReactNode
  /** Título grande del panel de marca */
  headline: string
  /** Frase corta bajo el headline */
  subline: string
  /** Título sobre el formulario */
  formTitle: string
  formSubtitle?: string
}

export function AuthShell({
  children,
  headline,
  subline,
  formTitle,
  formSubtitle,
}: AuthShellProps) {
  return (
    <main className="relative isolate flex min-h-screen overflow-hidden bg-[var(--mich-surface-muted)]">
      <div className="absolute right-4 top-4 z-30 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      {/* Panel marca — siempre oscuro */}
      <aside className="relative hidden w-[46%] overflow-hidden bg-[#060a14] text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          aria-hidden
          className="mich-auth-float mich-auth-pulse pointer-events-none absolute -left-24 top-1/4 size-[28rem] rounded-full bg-[var(--mich-blue)]/30 blur-[100px]"
        />
        <div
          aria-hidden
          className="mich-auth-float-alt pointer-events-none absolute bottom-0 right-0 size-[22rem] translate-x-1/4 translate-y-1/4 rounded-full bg-[#7b8cff]/28 blur-[90px]"
        />
        <div
          aria-hidden
          className="mich-auth-grid-drift pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 82%)",
          }}
        />

        {/* Acento circuito */}
        <svg
          aria-hidden
          className="pointer-events-none absolute bottom-24 left-0 h-40 w-full opacity-30"
          viewBox="0 0 600 160"
          fill="none"
        >
          <path
            d="M0 80 H120 C140 80 150 40 180 40 H280 C310 40 320 120 350 120 H600"
            stroke="url(#michCircuit)"
            strokeWidth="1.25"
            className="mich-auth-line"
          />
          <circle cx="180" cy="40" r="3.5" fill="#7eb6f5" className="mich-auth-pulse" />
          <circle cx="350" cy="120" r="3.5" fill="#b8a4ff" className="mich-auth-pulse" />
          <defs>
            <linearGradient id="michCircuit" x1="0" y1="0" x2="600" y2="0">
              <stop stopColor="#5d9cec" />
              <stop offset="1" stopColor="#b8a4ff" />
            </linearGradient>
          </defs>
        </svg>

        <div className="mich-auth-rise relative" style={{ animationDelay: "0.05s" }}>
          <BrandLogo
            tone="light"
            width={220}
            height={120}
            priority
            className="w-[170px] xl:w-[200px]"
          />
        </div>

        <div
          className="mich-auth-rise relative max-w-md pb-6"
          style={{ animationDelay: "0.18s" }}
        >
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
            MICHITECH
          </p>
          <div className="mich-auth-line mt-4 h-px w-16 bg-gradient-to-r from-[var(--mich-blue)] to-transparent" />
          <h1 className="mt-5 font-heading text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.05em] text-white xl:text-[3.25rem]">
            {headline}
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/55">
            {subline}
          </p>
        </div>

        <p
          className="mich-auth-fade relative text-[12px] tracking-wide text-white/30"
          style={{ animationDelay: "0.45s" }}
        >
          Recursos · Envato · Automatización
        </p>
      </aside>

      {/* Formulario */}
      <section className="relative flex flex-1 flex-col justify-center px-5 py-16 sm:px-10 lg:px-16 xl:px-24">
        <div
          aria-hidden
          className="mich-auth-float pointer-events-none absolute -right-20 top-10 size-72 rounded-full bg-[var(--mich-blue)]/15 blur-[80px] dark:bg-[var(--mich-blue)]/20"
        />
        <div
          aria-hidden
          className="mich-auth-float-alt pointer-events-none absolute -left-16 bottom-10 size-64 rounded-full bg-[var(--mich-indigo)]/10 blur-[70px] dark:bg-[var(--mich-indigo)]/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 lg:opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 80% 10%, rgba(93,156,236,0.18), transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(63,81,181,0.12), transparent 45%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-[400px]">
          <div
            className="mich-auth-rise mb-10 flex flex-col items-start lg:hidden"
            style={{ animationDelay: "0.05s" }}
          >
            <BrandLogo
              tone="auto"
              width={200}
              height={110}
              priority
              className="w-[150px]"
            />
          </div>

          <div className="mich-auth-rise" style={{ animationDelay: "0.12s" }}>
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
              Acceso
            </p>
            <div className="mich-auth-line mt-3 h-px w-12 bg-gradient-to-r from-[var(--mich-blue)] to-transparent" />
            <h2 className="mt-4 font-heading text-[2rem] font-semibold tracking-[-0.045em] text-[var(--mich-text)] sm:text-[2.25rem]">
              {formTitle}
            </h2>
            {formSubtitle ? (
              <p className="mt-2 text-[15px] leading-6 text-[var(--mich-muted)]">
                {formSubtitle}
              </p>
            ) : null}
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}
