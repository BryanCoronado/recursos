"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, type MouseEvent } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { LandingWordCycle } from "@/components/marketing/landing-word-cycle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ProviderChip = {
  id: string
  shortLabel: string
  logoSrc: string
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
  const panelRef = useRef<HTMLDivElement>(null)

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`
  }

  function onLeave() {
    const el = panelRef.current
    if (!el) return
    el.style.transform =
      "perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0)"
  }

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden pt-16">
      <div aria-hidden className="mich-lp-hero-bg pointer-events-none absolute inset-0" />
      <div aria-hidden className="mich-lp-aurora pointer-events-none absolute inset-0" />
      <div aria-hidden className="mich-lp-beams pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="mich-auth-grid-drift pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(79,143,232,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(79,143,232,0.09) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 35%, black 15%, transparent 70%)",
        }}
      />

      {/* Órbitas decorativas */}
      <div
        aria-hidden
        className="mich-lp-orbit pointer-events-none absolute left-1/2 top-[42%] hidden size-[34rem] lg:block"
      />
      <div
        aria-hidden
        className="mich-lp-orbit mich-lp-orbit-slow pointer-events-none absolute left-[72%] top-[48%] hidden size-[22rem] lg:block"
      />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
        <div className="mich-auth-stagger text-center lg:text-left">
          <div className="mich-lp-logo-spin mx-auto mb-6 flex size-20 items-center justify-center rounded-[1.5rem] border border-[var(--mich-border)] bg-[var(--mich-surface)]/95 p-3 shadow-[0_28px_70px_-30px_var(--mich-glow)] backdrop-blur lg:mx-0 lg:size-[5.25rem]">
            <BrandLogo
              width={80}
              height={80}
              className="size-14 lg:size-16"
              priority
            />
          </div>

          <p className="font-heading text-[12px] font-semibold uppercase tracking-[0.36em] text-[var(--mich-blue-bright)]">
            MICHITECH
          </p>

          <h1 className="font-heading mt-3 text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.055em] text-[var(--mich-text)] sm:text-5xl md:text-[3.25rem]">
            Descarga{" "}
            <LandingWordCycle />
            <span className="mt-1.5 block text-[var(--mich-text)]">
              en su propio panel
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-7 text-[var(--mich-muted)] lg:mx-0 sm:text-[17px]">
            En{" "}
            <strong className="font-medium text-[var(--mich-text)]">
              {siteHost}
            </strong>
            : paneles separados para Envato Elements y Magnific, con tutorial,
            progreso en vivo e historial. Prueba gratis y activa membresía cuando
            lo necesites.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {loggedIn ? (
              <Link
                href={appHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mich-lp-cta group h-12 rounded-2xl px-8 text-[15px]"
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
                    "mich-lp-cta group h-12 rounded-2xl px-8 text-[15px]"
                  )}
                >
                  Empezar gratis
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-2xl border-[var(--mich-border)] bg-[var(--mich-surface)]/55 px-8 text-[15px] backdrop-blur transition hover:-translate-y-0.5"
                  )}
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-[var(--mich-muted)] lg:justify-start">
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--mich-success)]" />
              {freeLimit} descargas gratis
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--mich-success)]" />
              desde S/ {monthlyPrice} / ${monthlyPriceUsd} USD al mes
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--mich-success)]" />
              1 dispositivo incluido
            </li>
          </ul>
        </div>

        <div className="mich-auth-rise relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden
            className="mich-auth-float pointer-events-none absolute -left-10 top-4 size-48 rounded-full bg-[var(--mich-blue)]/30 blur-[70px]"
          />
          <div
            aria-hidden
            className="mich-auth-float-alt pointer-events-none absolute -right-8 bottom-6 size-52 rounded-full bg-[var(--mich-indigo)]/22 blur-[80px]"
          />

          <div
            ref={panelRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className="mich-lp-panel mich-lp-tilt relative overflow-hidden rounded-[1.85rem] border border-[var(--mich-border)] bg-[var(--mich-surface)]/95 p-5 shadow-[0_48px_90px_-42px_rgba(12,20,36,0.5)] backdrop-blur-xl will-change-transform sm:p-6"
          >
            <div className="mich-lp-shine pointer-events-none absolute inset-0" aria-hidden />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(79,143,232,0.18),transparent_70%)]"
            />

            <div className="relative mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-heading text-sm font-semibold tracking-[-0.02em]">
                  Descarga en vivo
                </span>
              </div>
              <span className="mich-chip mich-chip-ok mich-lp-chip-pulse">
                Listo
              </span>
            </div>

            <div className="relative space-y-3">
              {providers.map((p, i) => (
                <div
                  key={p.id}
                  className="mich-lp-row flex items-center gap-3 rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)]/85 px-3.5 py-3.5"
                  style={{ animationDelay: `${0.35 + i * 0.12}s` }}
                >
                  <span className="flex size-11 items-center justify-center rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-1.5 shadow-sm">
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
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--mich-surface)] ring-1 ring-[var(--mich-border)]">
                      <div
                        className="mich-lp-progress h-full rounded-full"
                        style={{
                          width: i === 0 ? "100%" : "78%",
                          animationDelay: `${0.5 + i * 0.15}s`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-[var(--mich-blue-bright)]">
                    {i === 0 ? "100%" : "78%"}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative mt-5 rounded-2xl border border-dashed border-[var(--mich-border)] bg-[color-mix(in_srgb,var(--mich-blue)_6%,transparent)] px-3.5 py-3.5 text-[12px] leading-5 text-[var(--mich-muted)]">
              Envato y Magnific por separado · tutorial incluido · mismo dominio
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
