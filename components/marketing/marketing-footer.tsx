import Link from "next/link"

import { BrandLogo } from "@/components/brand/brand-logo"
import {
  MONTHLY_PRICE_SOLES,
  MONTHLY_PRICE_USD,
} from "@/lib/billing/plans"
import { SITE } from "@/lib/site"

export function MarketingFooter({ wa }: { wa: string }) {
  return (
    <footer className="border-t border-[var(--mich-border)] bg-[var(--mich-surface)] py-10 sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <BrandLogo width={40} height={40} className="size-10" />
          <div>
            <p className="font-heading text-sm font-semibold tracking-[-0.02em]">
              {SITE.name}
            </p>
            <p className="text-xs text-[var(--mich-muted)]">
              Envato · Magnific · {SITE.host}
            </p>
          </div>
        </div>
        <nav
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--mich-muted)]"
          aria-label="Pie de página"
        >
          <Link href="/#envato" className="hover:text-[var(--mich-text)]">
            Envato
          </Link>
          <Link href="/#magnific" className="hover:text-[var(--mich-text)]">
            Magnific
          </Link>
          <Link href="/#planes" className="hover:text-[var(--mich-text)]">
            Planes
          </Link>
          <Link href="/blog" className="hover:text-[var(--mich-text)]">
            Blog
          </Link>
          <Link href="/#faq" className="hover:text-[var(--mich-text)]">
            FAQ
          </Link>
          <Link href="/login" className="hover:text-[var(--mich-text)]">
            Entrar
          </Link>
          <Link href="/register" className="hover:text-[var(--mich-text)]">
            Registro
          </Link>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--mich-text)]"
          >
            Soporte
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-[var(--mich-muted)] sm:px-6">
        © {new Date().getFullYear()} {SITE.legalName}. Descargar Envato
        Elements y Magnific online en Perú. Precios desde S/{" "}
        {MONTHLY_PRICE_SOLES} o ${MONTHLY_PRICE_USD} USD / mes. Todos los
        derechos reservados.
      </p>
    </footer>
  )
}
