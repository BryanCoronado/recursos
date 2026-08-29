import type { ReactNode } from "react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { ThemeToggle } from "@/components/theme/theme-toggle"

type AuthShellProps = {
  children: ReactNode
  headline: string
  subline: string
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
    <main className="relative isolate flex min-h-screen bg-[var(--mich-surface-muted)]">
      <div className="absolute right-4 top-4 z-30 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <aside className="relative hidden w-[44%] overflow-hidden bg-[#0b1220] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-20 size-72 rounded-full bg-[var(--mich-blue)]/25 blur-3xl"
        />
        <BrandLogo
          tone="light"
          width={220}
          height={120}
          priority
          className="relative w-[150px] xl:w-[170px]"
        />

        <div className="relative max-w-md pb-4">
          <h1 className="font-heading text-[2.55rem] font-semibold leading-[1.1] tracking-[-0.04em] xl:text-[2.9rem]">
            {headline}
          </h1>
          <p className="mt-5 max-w-sm text-[16px] leading-8 text-white/60">
            {subline}
          </p>
        </div>

        <p className="relative text-[13px] text-white/35">
          Envato · Magnific · progreso en vivo
        </p>
      </aside>

      <section className="relative flex flex-1 flex-col justify-center px-5 py-16 sm:px-10 lg:px-16 xl:px-24">
        <div className="relative mx-auto w-full max-w-[400px]">
          <div className="mb-10 flex flex-col items-start lg:hidden">
            <BrandLogo
              tone="auto"
              width={200}
              height={110}
              priority
              className="w-[130px]"
            />
          </div>

          <h2 className="font-heading text-[2rem] font-semibold tracking-[-0.04em] text-[var(--mich-text)]">
            {formTitle}
          </h2>
          {formSubtitle ? (
            <p className="mt-2 text-[15px] leading-7 text-[var(--mich-muted)]">
              {formSubtitle}
            </p>
          ) : null}

          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}
