"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { LandingWordCycle } from "@/components/marketing/landing-word-cycle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ProviderChip = {
  id: string
  shortLabel: string
  logoSrc: string
  dashboardPath: string
}

export function LandingHero({
  loggedIn,
  appHref,
  freeLimit,
  monthlyPrice,
  monthlyPriceUsd,
  providers,
  siteHost,
}: {
  loggedIn: boolean
  appHref: string
  freeLimit: number
  monthlyPrice: number
  monthlyPriceUsd: number
  providers: ProviderChip[]
  siteHost: string
}) {
  const [active, setActive] = useState(0)
  const [pct, setPct] = useState<number[]>(() =>
    providers.map((_, i) => (i === 0 ? 18 : 8))
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((current) =>
        current.map((value, i) => {
          const cap = i === active ? 100 : 72
          const step = i === active ? 2.4 : 1.1
          return Math.min(cap, value + step)
        })
      )
    }, 70)
    return () => window.clearInterval(id)
  }, [active])

  useEffect(() => {
    setPct(providers.map((_, i) => (i === active ? 22 : 10)))
  }, [active, providers])

  return (
    <section className="relative isolate overflow-hidden pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--mich-blue)_18%,transparent),transparent_58%)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div>
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-2 shadow-[var(--mich-shadow-soft)]">
            <BrandLogo width={72} height={72} className="size-8" priority />
          </div>

          <p className="text-[13px] font-medium text-[var(--mich-blue-bright)]">
            {siteHost}
          </p>

          <h1 className="font-heading mt-3 text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.045em] text-[var(--mich-text)] sm:text-5xl lg:text-[3.35rem]">
            Descarga{" "}
            <LandingWordCycle />
            <span className="mt-1.5 block">en su propio panel</span>
          </h1>

          <p className="mt-5 max-w-lg text-[16px] leading-7 text-[var(--mich-muted)]">
            Pega el link, mira el progreso en vivo y baja el ZIP. Para
            freelancers y agencias en Perú y Latam: Envato y Magnific, cada uno
            en su panel, con tutorial y {freeLimit} descargas para probar.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {loggedIn ? (
              <Link
                href={appHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group h-12 rounded-2xl px-7 text-[15px] transition-transform hover:-translate-y-0.5"
                )}
              >
                Ir al panel
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group h-12 rounded-2xl px-7 text-[15px] transition-transform hover:-translate-y-0.5"
                  )}
                >
                  Probar {freeLimit} descargas
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-2xl px-6 text-[15px] transition-transform hover:-translate-y-0.5"
                  )}
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[var(--mich-muted)]">
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--mich-success)]" />
              {freeLimit} descargas gratis
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--mich-success)]" />
              desde S/ {monthlyPrice} / ${monthlyPriceUsd} USD
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--mich-success)]" />
              1 dispositivo incluido
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-5 shadow-[var(--mich-shadow-page)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--mich-success)] opacity-50" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--mich-success)]" />
              </span>
              <span className="font-heading text-sm font-semibold">
                Descarga en vivo
              </span>
            </div>
            <span className="mich-chip mich-chip-ok">Interactivo</span>
          </div>

          <div className="space-y-2.5">
            {providers.map((p, i) => {
              const value = Math.round(pct[i] ?? 0)
              const selected = active === i
              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-300",
                    selected
                      ? "border-[var(--mich-blue)]/40 bg-[color-mix(in_srgb,var(--mich-blue)_8%,transparent)]"
                      : "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] hover:border-[var(--mich-blue)]/25"
                  )}
                >
                  <span className="flex size-11 items-center justify-center rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-1.5">
                    <Image
                      src={p.logoSrc}
                      alt={p.shortLabel}
                      width={28}
                      height={28}
                      unoptimized
                      className="h-7 w-auto object-contain"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--mich-text)]">
                      {p.shortLabel} · recurso.zip
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--mich-surface)]">
                      <div
                        className="mich-dl-bar h-full rounded-full transition-[width] duration-150"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-[var(--mich-blue-bright)]">
                    {value}%
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-5 text-[12px] leading-5 text-[var(--mich-muted)]">
            Pasa el cursor: cada proveedor corre aparte, como en el panel real.
          </p>
        </div>
      </div>
    </section>
  )
}
