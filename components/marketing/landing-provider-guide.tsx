"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ArrowUpRight, CirclePlay, Download, Link2, Search, Zap } from "lucide-react"

import { LandingReveal } from "@/components/marketing/landing-reveal"
import { buttonVariants } from "@/components/ui/button"
import { youtubeEmbedId } from "@/lib/youtube"
import { cn } from "@/lib/utils"

export type ProviderGuideData = {
  id: string
  slug: string
  label: string
  shortLabel: string
  logoSrc: string
  dashboardPath: string
  browseUrl: string
  browseLabel: string
  headline: string
  description: string
  bullets: string[]
  tutorialYoutubeUrl?: string
  steps: { title: string; body: string }[]
}

const STEP_ICONS = [Search, Link2, Download, Zap] as const

export function LandingProviderGuide({
  provider,
  loggedIn,
  reverse = false,
}: {
  provider: ProviderGuideData
  loggedIn: boolean
  appHref?: string
  reverse?: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)
  const videoId = provider.tutorialYoutubeUrl
    ? youtubeEmbedId(provider.tutorialYoutubeUrl)
    : null
  const ctaHref = loggedIn ? provider.dashboardPath : "/register"

  return (
    <section
      id={provider.slug}
      className="scroll-mt-24 py-16 sm:py-24"
      aria-labelledby={`${provider.slug}-title`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={cn(
            "grid items-start gap-10 lg:grid-cols-2 lg:gap-14",
            reverse && "lg:[&>*:first-child]:order-2"
          )}
        >
          {/* Producto */}
          <LandingReveal variant={reverse ? "right" : "left"}>
            <div className="flex items-center gap-3">
              <span className="flex size-14 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-2.5 shadow-[var(--mich-shadow-soft)] sm:size-16">
                <Image
                  src={provider.logoSrc}
                  alt={`Logo ${provider.shortLabel}`}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-10 w-10 object-contain sm:h-11 sm:w-11"
                />
              </span>
              <div>
                <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
                  Proveedor
                </p>
                <h2
                  id={`${provider.slug}-title`}
                  className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl"
                >
                  {provider.headline}
                </h2>
              </div>
            </div>

            <p className="mt-5 text-[15px] leading-7 text-[var(--mich-muted)] sm:text-base">
              {provider.description}
            </p>

            <ul className="mt-6 space-y-2.5">
              {provider.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-sm text-[var(--mich-text)]"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--mich-blue)]" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mich-lp-cta h-11 rounded-2xl px-6 text-[14px]"
                )}
              >
                {loggedIn ? `Abrir ${provider.shortLabel}` : "Empezar gratis"}
                <ArrowRight />
              </Link>
              <a
                href={provider.browseUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 rounded-2xl px-5 text-[14px]"
                )}
              >
                {provider.browseLabel}
                <ArrowUpRight />
              </a>
            </div>
          </LandingReveal>

          {/* Tutorial */}
          <LandingReveal delay={100} variant={reverse ? "left" : "right"}>
            <div className="mich-soft-card mich-lp-shine relative overflow-hidden p-4 sm:p-5">
              <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="font-heading text-sm font-semibold tracking-[-0.02em]">
                  Tutorial {provider.shortLabel}
                </p>
                <span className="mich-chip text-[10px]">Paso a paso</span>
              </div>

              {videoId ? (
                <div className="mich-lp-video relative mb-5 overflow-hidden rounded-2xl border border-[var(--mich-border)] bg-black/90 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.45)]">
                  <div className="relative aspect-video">
                    <iframe
                      title={`Tutorial cómo descargar ${provider.label} con MICHITECH`}
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                      className="absolute inset-0 size-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                    <CirclePlay className="size-3" />
                    Video
                  </div>
                </div>
              ) : null}

              <ol className="space-y-2" aria-label={`Pasos tutorial ${provider.shortLabel}`}>
                {provider.steps.map((step, i) => {
                  const Icon = STEP_ICONS[i] ?? Zap
                  const active = activeStep === i
                  return (
                    <li key={step.title}>
                      <button
                        type="button"
                        onClick={() => setActiveStep(i)}
                        onMouseEnter={() => setActiveStep(i)}
                        className={cn(
                          "mich-lp-step w-full rounded-2xl border px-3.5 py-3 text-left transition-all duration-300",
                          active
                            ? "border-[var(--mich-blue)]/45 bg-[color-mix(in_srgb,var(--mich-blue)_10%,transparent)] shadow-[0_16px_36px_-28px_var(--mich-glow)]"
                            : "border-transparent bg-[var(--mich-surface-muted)]/70 hover:border-[var(--mich-border)]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border text-[var(--mich-blue)] transition",
                              active
                                ? "border-[var(--mich-blue)]/35 bg-[var(--mich-surface)]"
                                : "border-[var(--mich-border)] bg-[var(--mich-surface)]"
                            )}
                          >
                            <Icon className="size-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-[10px] font-semibold tabular-nums text-[var(--mich-blue-bright)]">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <h3 className="font-heading text-sm font-semibold tracking-[-0.02em]">
                                {step.title}
                              </h3>
                            </div>
                            <p
                              className={cn(
                                "mt-1 text-[13px] leading-5 text-[var(--mich-muted)] transition-all duration-300",
                                active
                                  ? "max-h-24 opacity-100"
                                  : "max-h-0 overflow-hidden opacity-0 sm:max-h-24 sm:opacity-100"
                              )}
                            >
                              {step.body}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          </LandingReveal>
        </div>
      </div>
    </section>
  )
}
