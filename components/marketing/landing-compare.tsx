import { Check, Minus } from "lucide-react"

import { LandingReveal } from "@/components/marketing/landing-reveal"
import {
  FREE_DOWNLOAD_LIMIT,
  MONTHLY_PRICE_SOLES,
  MONTHLY_PRICE_USD,
} from "@/lib/billing/plans"

const ROWS = [
  {
    label: "Precio de entrada",
    official: "Suele superar 16 USD/mes",
    ours: `S/ ${MONTHLY_PRICE_SOLES} o $${MONTHLY_PRICE_USD} USD / mes`,
  },
  {
    label: "Probar sin tarjeta",
    official: false,
    ours: `${FREE_DOWNLOAD_LIMIT} descargas gratis por proveedor`,
  },
  {
    label: "Pago en soles",
    official: false,
    ours: "WhatsApp en PEN o USD",
  },
  {
    label: "Tutorial en español",
    official: "Ayuda genérica",
    ours: "Video + pasos en la landing",
  },
  {
    label: "Envato y Magnific",
    official: "Cuentas y precios aparte",
    ours: "Dos paneles, sin mezclar historial",
  },
  {
    label: "Activación",
    official: "Pasarela internacional",
    ours: "El mismo día por WhatsApp",
  },
] as const

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="size-4 text-[var(--mich-success)]" />
  }
  if (value === false) {
    return <Minus className="size-4 text-[var(--mich-muted)]" />
  }
  return <span>{value}</span>
}

export function LandingCompare() {
  return (
    <section
      id="por-que"
      className="scroll-mt-24 py-16 sm:py-24"
      aria-labelledby="por-que-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <p className="text-[13px] font-medium text-[var(--mich-blue-bright)]">
            Por qué MICHITECH
          </p>
          <h2
            id="por-que-title"
            className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
          >
            La membresía oficial no siempre cabe en el mes.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mich-muted)]">
            Si ya te rinde el plan oficial, genial. Si necesitas bajar recursos
            con un costo claro en Perú y Latam, este es el hueco.
          </p>
        </LandingReveal>

        <LandingReveal delay={80}>
          <div className="mich-soft-card mt-10 overflow-x-auto sm:mt-12">
            <div className="min-w-[38rem]">
            <div className="grid grid-cols-[1.1fr_1fr_1.15fr] border-b border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--mich-muted)] sm:px-5 sm:text-xs">
              <span>Qué miras</span>
              <span>Membresía oficial</span>
              <span className="text-[var(--mich-blue-bright)]">MICHITECH</span>
            </div>
            {ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.1fr_1fr_1.15fr] items-center gap-2 border-b border-[var(--mich-border)] px-3 py-3.5 text-[13px] last:border-b-0 sm:px-5 sm:text-sm"
              >
                <span className="font-medium text-[var(--mich-text)]">
                  {row.label}
                </span>
                <span className="leading-5 text-[var(--mich-muted)]">
                  <Cell value={row.official} />
                </span>
                <span className="leading-5 text-[var(--mich-text)]">
                  <Cell value={row.ours} />
                </span>
              </div>
            ))}
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}
