import Image from "next/image"

import { Input } from "@/components/ui/input"

type ResourceInputProps = {
  name: string
  description: string
  placeholder: string
  logoSrc: string
  logoAlt: string
}

export function ResourceInput({
  name,
  description,
  placeholder,
  logoSrc,
  logoAlt,
}: ResourceInputProps) {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-10rem)] items-center justify-center overflow-hidden rounded-3xl border border-[var(--mich-border)] bg-white px-6 py-20 shadow-[0_24px_60px_-36px_rgba(11,18,32,0.3)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(93,156,236,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(93,156,236,0.08) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage:
            "radial-gradient(ellipse at center, black 18%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--mich-blue)]/15 blur-[120px]" />
      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-[var(--mich-border)] bg-white p-3 shadow-[0_12px_30px_-16px_var(--mich-glow)]">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={72}
            height={72}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>
        <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--mich-blue-bright)]">
          Módulo de recursos
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-5xl">
          {name}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-[var(--mich-muted)]">
          {description}
        </p>
        <Input
          aria-label={`Entrada para ${name}`}
          placeholder={placeholder}
          autoFocus
          className="relative z-10 mt-10 h-14 rounded-2xl border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-5 text-base text-[var(--mich-text)] shadow-sm placeholder:text-[var(--mich-muted)]/55 focus-visible:border-[var(--mich-blue)]/55 focus-visible:ring-[var(--mich-blue)]/25"
        />
      </div>
    </section>
  )
}
