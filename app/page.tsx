import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  Check,
  Download,
  Link2,
  MessageCircle,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { LandingCountUp } from "@/components/marketing/landing-count-up"
import { LandingHero } from "@/components/marketing/landing-hero"
import { LandingNav } from "@/components/marketing/landing-nav"
import {
  LandingProviderGuide,
  type ProviderGuideData,
} from "@/components/marketing/landing-provider-guide"
import { LandingReveal } from "@/components/marketing/landing-reveal"
import { LandingScrollProgress } from "@/components/marketing/landing-scroll-progress"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/authorization"
import { resolveHomePath } from "@/lib/auth/home-path"
import {
  EXTRA_DEVICE_MONTHLY_SOLES,
  EXTRA_DEVICE_MONTHLY_USD,
  FREE_DOWNLOAD_LIMIT,
  MONTHLY_PRICE_SOLES,
  MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLANS,
  planPerMonthSoles,
  planPerMonthUsd,
  planSavingsSoles,
  planTotalSoles,
  planTotalUsd,
  type SubscriptionPlanKey,
} from "@/lib/billing/plans"
import { PROVIDERS } from "@/lib/providers/catalog"
import { SITE, absoluteUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

const TITLE =
  "Descargar Envato Elements y Magnific en Perú | MICHITECH desde S/ 20 o $6 USD"
const DESCRIPTION =
  "Descarga Envato Elements y Magnific online con MICHITECH. Paneles separados, tutorial, historial y progreso en vivo. 2 descargas gratis. Membresía desde S/ 20 o $6 USD al mes. Activación por WhatsApp en Perú y Latinoamérica."

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "MICHITECH",
    "descargar Envato Elements",
    "descargar Envato Elements Perú",
    "Envato Elements barato",
    "membresía Envato Elements",
    "alternativa Envato Elements",
    "tutorial Envato Elements",
    "descargar Magnific",
    "Magnific AI Perú",
    "tutorial Magnific",
    "recursos digitales Perú",
    "plantillas Envato",
    "stock Envato",
    "gráficos Envato",
    "música Envato Elements",
    "panel Envato online",
    "panel Magnific",
    "descargas ilimitadas Envato",
    "precio Envato Elements dólares",
    "Envato Elements USD",
    "michitech.digital",
  ],
  alternates: {
    canonical: absoluteUrl("/"),
    languages: {
      "es-PE": absoluteUrl("/"),
      es: absoluteUrl("/"),
    },
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: absoluteUrl("/"),
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  other: {
    "geo.region": "PE",
    "geo.placename": "Perú",
  },
}

const FAQ = [
  {
    q: "¿Envato y Magnific son el mismo servicio?",
    a: "No. Son proveedores distintos con roles separados (Clientes Envato y Clientes Magnific). Puedes tener uno o ambos; cada uno tiene su panel y cupo gratis independiente.",
  },
  {
    q: "¿Cómo descargo Envato Elements con MICHITECH?",
    a: "Entra al panel Envato, copia la URL del recurso en elements.envato.com, pégala y pulsa Descargar. Cuando termine, baja el archivo desde el historial.",
  },
  {
    q: "¿Cómo descargo Magnific?",
    a: "Entra al panel Magnific, copia la URL del recurso en magnific.com, pégala y pulsa Descargar. El progreso y el archivo quedan en el historial de Magnific.",
  },
  {
    q: "¿Hay plan gratis para probar?",
    a: `Sí. Incluye ${FREE_DOWNLOAD_LIMIT} descargas gratis por proveedor para probar el flujo completo antes de activar una membresía.`,
  },
  {
    q: "¿Cuánto cuesta la membresía en soles y dólares?",
    a: `Desde S/ ${MONTHLY_PRICE_SOLES} o $${MONTHLY_PRICE_USD} USD al mes. Pack 3 meses: S/ 54 / $15 USD. Pack 1 año: S/ 180 / $49 USD. La activación es por WhatsApp.`,
  },
  {
    q: "¿Puedo pagar en dólares?",
    a: `Sí. Publicamos el equivalente en USD (1 mes $${MONTHLY_PRICE_USD}, 3 meses $15, 1 año $49). Coordina el pago por WhatsApp en soles o dólares.`,
  },
  {
    q: "¿Cuántos dispositivos puedo usar?",
    a: `Cada plan incluye 1 dispositivo. Extra: +S/ ${EXTRA_DEVICE_MONTHLY_SOLES} o +$${EXTRA_DEVICE_MONTHLY_USD} USD al mes, por WhatsApp.`,
  },
  {
    q: "¿MICHITECH funciona en Perú y Latinoamérica?",
    a: "Sí. El panel es web: funciona en Perú, México, Colombia y el resto de Latinoamérica. El soporte principal es por WhatsApp.",
  },
] as const

const PLAN_KEYS = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanKey[]

const STEPS = [
  {
    icon: Link2,
    title: "Elige el proveedor",
    body: "Abre el panel de Envato o el de Magnific — cada uno es independiente.",
  },
  {
    icon: Download,
    title: "Pega el enlace",
    body: "Copia la URL del recurso en ese proveedor y pégala en su panel.",
  },
  {
    icon: Zap,
    title: "Descarga el archivo",
    body: "Sigue el progreso en vivo y recoge el ZIP desde el historial.",
  },
] as const

const MARQUEE = [
  "Envato Elements",
  "Magnific",
  "Tutoriales",
  "Descargas en vivo",
  "Historial por proveedor",
  "Membresías",
  "1 dispositivo incluido",
  "Activación WhatsApp",
]

const ENVATO_GUIDE: ProviderGuideData = {
  id: PROVIDERS.ENVATO.id,
  slug: PROVIDERS.ENVATO.slug,
  label: PROVIDERS.ENVATO.label,
  shortLabel: PROVIDERS.ENVATO.shortLabel,
  logoSrc: PROVIDERS.ENVATO.logoSrc,
  dashboardPath: PROVIDERS.ENVATO.dashboardPath,
  browseUrl: "https://elements.envato.com/es/",
  browseLabel: "Abrir Envato Elements",
  headline: "Descargar Envato Elements",
  description:
    "Plantillas, gráficos, música, vídeo y más desde Envato Elements. Panel exclusivo, historial propio y tutorial en video para que no te pierdas.",
  bullets: [
    "Panel solo para Envato (no se mezcla con Magnific)",
    "Progreso en vivo e historial de descargas",
    "Tutorial en video + pasos claros",
  ],
  tutorialYoutubeUrl: "https://youtu.be/7Gjz5ax5J9U",
  steps: [
    {
      title: "Busca en Envato Elements",
      body: "Entra a elements.envato.com y abre el recurso que quieres.",
    },
    {
      title: "Copia la URL",
      body: "Copia el enlace completo de la página del producto.",
    },
    {
      title: "Pégalo en el panel Envato",
      body: "En MICHITECH → Envato, pega el enlace y pulsa Descargar recurso.",
    },
    {
      title: "Recoge el ZIP",
      body: "Cuando diga Completada, descarga el archivo desde el historial de Envato.",
    },
  ],
}

const MAGNIFIC_GUIDE: ProviderGuideData = {
  id: PROVIDERS.MAGNIFIC.id,
  slug: PROVIDERS.MAGNIFIC.slug,
  label: PROVIDERS.MAGNIFIC.label,
  shortLabel: PROVIDERS.MAGNIFIC.shortLabel,
  logoSrc: PROVIDERS.MAGNIFIC.logoSrc,
  dashboardPath: PROVIDERS.MAGNIFIC.dashboardPath,
  browseUrl: "https://www.magnific.com/",
  browseLabel: "Abrir Magnific",
  headline: "Descargar Magnific",
  description:
    "Magnific va por su propio camino: panel separado, cupo e historial independientes. Sigue el tutorial paso a paso y descarga sin mezclarlo con Envato.",
  bullets: [
    "Panel exclusivo de Magnific",
    "Historial y progreso solo de Magnific",
    "Tutorial paso a paso en la landing",
  ],
  steps: [
    {
      title: "Abre Magnific",
      body: "Entra a magnific.com y localiza el recurso que necesitas.",
    },
    {
      title: "Copia el enlace",
      body: "Copia la URL completa de la página del producto.",
    },
    {
      title: "Pégalo en el panel Magnific",
      body: "En MICHITECH → Magnific, pega el enlace y pulsa Descargar recurso.",
    },
    {
      title: "Descarga el archivo",
      body: "Cuando termine, baja el archivo desde el historial de Magnific.",
    },
  ],
}

export default async function LandingPage() {
  const user = await getCurrentUser()
  const appHref = user ? resolveHomePath(user.permissions) : "/go"
  const wa = `https://wa.me/${SITE.whatsapp.phone}?text=${encodeURIComponent(
    "Hola, quiero información sobre MICHITECH (Envato o Magnific)."
  )}`

  const guides = [ENVATO_GUIDE, MAGNIFIC_GUIDE]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.legalName,
        alternateName: SITE.name,
        url: SITE.url,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/icon-512.png"),
          width: 512,
          height: 512,
        },
        image: absoluteUrl("/icon-512.png"),
        sameAs: [`https://wa.me/${SITE.whatsapp.phone}`],
        areaServed: ["PE", "MX", "CO", "AR", "CL", "EC"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: `+${SITE.whatsapp.phone}`,
            contactType: "customer support",
            areaServed: "PE",
            availableLanguage: ["Spanish"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: DESCRIPTION,
        publisher: { "@id": `${SITE.url}/#organization` },
        inLanguage: "es-PE",
        potentialAction: {
          "@type": "RegisterAction",
          target: absoluteUrl("/register"),
          name: "Crear cuenta MICHITECH",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/#webpage`,
        url: absoluteUrl("/"),
        name: TITLE,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE.url}/#website` },
        about: { "@id": `${SITE.url}/#organization` },
        inLanguage: "es-PE",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteUrl("/icon-512.png"),
        },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE.legalName,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Resource download panel",
        operatingSystem: "Web",
        url: SITE.url,
        image: absoluteUrl("/icon-512.png"),
        offers: [
          {
            "@type": "AggregateOffer",
            lowPrice: String(MONTHLY_PRICE_SOLES),
            highPrice: String(planTotalSoles("YEARLY")),
            priceCurrency: "PEN",
            offerCount: PLAN_KEYS.length,
          },
          {
            "@type": "AggregateOffer",
            lowPrice: String(MONTHLY_PRICE_USD),
            highPrice: String(planTotalUsd("YEARLY")),
            priceCurrency: "USD",
            offerCount: PLAN_KEYS.length,
          },
        ],
        featureList: [
          "Descargar Envato Elements online",
          "Descargar Magnific online",
          "Tutoriales por proveedor",
          "Historial y progreso en vivo",
          "Control de dispositivos",
          "Precios en soles y dólares",
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "Planes MICHITECH",
        itemListElement: PLAN_KEYS.map((key, i) => ({
          "@type": "Offer",
          position: i + 1,
          name: `Membresía ${SUBSCRIPTION_PLANS[key].label}`,
          price: String(planTotalUsd(key)),
          priceCurrency: "USD",
          description: `S/ ${planTotalSoles(key)} o $${planTotalUsd(key)} USD · ${SUBSCRIPTION_PLANS[key].months} mes(es)`,
          availability: "https://schema.org/InStock",
          url: absoluteUrl("/#planes"),
        })),
      },
      ...guides.map((g) => ({
        "@type": "HowTo",
        name: `Cómo descargar ${g.label} con MICHITECH`,
        description: g.description,
        url: absoluteUrl(`/#${g.slug}`),
        step: g.steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.title,
          text: step.body,
        })),
        ...(g.tutorialYoutubeUrl
          ? {
              video: {
                "@type": "VideoObject",
                name: `Tutorial ${g.label} — MICHITECH`,
                description: `Video tutorial para descargar ${g.label} con MICHITECH`,
                embedUrl: g.tutorialYoutubeUrl,
                thumbnailUrl: absoluteUrl("/logo-sinfondo-michitech.png"),
                uploadDate: "2025-01-01",
              },
            }
          : {}),
      })),
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
      {
        "@type": "ItemList",
        name: "Proveedores MICHITECH",
        itemListElement: guides.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: g.label,
          url: absoluteUrl(`/#${g.slug}`),
          description: g.description,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: absoluteUrl("/"),
          },
        ],
      },
    ],
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--mich-surface-muted)] text-[var(--mich-text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LandingScrollProgress />
      <LandingNav loggedIn={Boolean(user)} appHref={appHref} />

      <LandingHero
        loggedIn={Boolean(user)}
        appHref={appHref}
        freeLimit={FREE_DOWNLOAD_LIMIT}
        monthlyPrice={MONTHLY_PRICE_SOLES}
        monthlyPriceUsd={MONTHLY_PRICE_USD}
        siteHost={SITE.host}
        providers={guides.map((p) => ({
          id: p.id,
          shortLabel: p.shortLabel,
          logoSrc: p.logoSrc,
        }))}
      />

      <div className="border-y border-[var(--mich-border)] bg-[var(--mich-surface)]/70 py-3.5 backdrop-blur">
        <div className="overflow-hidden">
          <div className="mich-lp-marquee-track gap-8 px-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--mich-muted)]">
            {[...MARQUEE, ...MARQUEE].map((label, i) => (
              <span key={`${label}-${i}`} className="inline-flex items-center gap-8">
                <span>{label}</span>
                <span className="text-[var(--mich-blue)]/50" aria-hidden>
                  ·
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <section
        className="py-12 sm:py-16"
        aria-label="Ventajas de MICHITECH en números"
      >
        <div className="mx-auto grid max-w-6xl gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6">
          {[
            {
              value: FREE_DOWNLOAD_LIMIT,
              label: "descargas gratis al empezar",
              delay: 0,
            },
            {
              value: MONTHLY_PRICE_SOLES,
              prefix: "S/ ",
              extra: ` / $${MONTHLY_PRICE_USD} USD`,
              label: "desde / mes por membresía",
              delay: 80,
            },
            {
              value: 2,
              label: "paneles: Envato y Magnific",
              delay: 160,
            },
          ].map((stat) => (
            <LandingReveal key={stat.label} delay={stat.delay} variant="scale">
              <div className="mich-soft-card mich-lp-stat mich-lp-hover-lift px-4 py-5 text-center sm:px-5 sm:py-6">
                <p className="font-heading text-3xl font-semibold tracking-[-0.05em] text-[var(--mich-text)] sm:text-5xl">
                  <LandingCountUp
                    to={stat.value}
                    prefix={"prefix" in stat ? stat.prefix : ""}
                  />
                  {"extra" in stat ? (
                    <span className="ml-1 text-2xl text-[var(--mich-muted)] sm:text-3xl">
                      {stat.extra}
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-sm text-[var(--mich-muted)]">{stat.label}</p>
              </div>
            </LandingReveal>
          ))}
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-24 py-16 sm:py-24"
        aria-labelledby="como-funciona-title"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
              Cómo funciona
            </p>
            <h2
              id="como-funciona-title"
              className="font-heading mt-2 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
            >
              Un dominio. Dos paneles separados.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mich-muted)]">
              Envato Elements y Magnific no se mezclan: cada proveedor tiene su
              flujo, historial y tutorial.
            </p>
          </LandingReveal>

          <ol className="mt-10 grid gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <LandingReveal key={step.title} delay={i * 90} variant="scale">
                <li className="mich-soft-card mich-lp-hover-lift relative h-full p-5 sm:p-6">
                  <span className="font-heading text-[11px] font-semibold tabular-nums text-[var(--mich-blue-bright)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <step.icon className="mt-4 size-6 text-[var(--mich-blue)] sm:mt-5 sm:size-7" />
                  <h3 className="font-heading mt-3 text-lg font-semibold tracking-[-0.03em] sm:mt-4 sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--mich-muted)]">
                    {step.body}
                  </p>
                </li>
              </LandingReveal>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#envato"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl"
              )}
            >
              Ver tutorial Envato
            </a>
            <a
              href="#magnific"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl"
              )}
            >
              Ver tutorial Magnific
            </a>
          </div>

          <LandingReveal delay={80}>
            <div className="mich-soft-card mt-12 p-5 sm:p-7">
              <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                Descargar Envato Elements y Magnific online en Perú
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-[var(--mich-muted)]">
                MICHITECH es el panel web en{" "}
                <strong className="font-medium text-[var(--mich-text)]">
                  michitech.digital
                </strong>{" "}
                para descargar recursos de Envato Elements (plantillas, gráficos,
                música, vídeo) y Magnific, cada uno en su propio módulo. No
                mezclamos historiales: el rol{" "}
                <strong className="font-medium text-[var(--mich-text)]">
                  Clientes Envato
                </strong>{" "}
                solo ve Envato y el rol{" "}
                <strong className="font-medium text-[var(--mich-text)]">
                  Clientes Magnific
                </strong>{" "}
                solo ve Magnific. Si necesitas ambos, se asignan los dos roles.
              </p>
              <p className="mt-3 text-[15px] leading-7 text-[var(--mich-muted)]">
                Empiezas con {FREE_DOWNLOAD_LIMIT} descargas gratis por
                proveedor. La membresía ilimitada cuesta desde S/{" "}
                {MONTHLY_PRICE_SOLES} o ${MONTHLY_PRICE_USD} USD al mes, con
                packs de 3 meses (S/ 54 / $15 USD) y 1 año (S/ 180 / $49 USD).
                Pagas en soles o dólares por WhatsApp y activamos el plan el
                mismo día.
              </p>
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Envato — panel + tutorial */}
      <div className="border-y border-[var(--mich-border)] bg-[var(--mich-surface)]/40">
        <LandingProviderGuide
          provider={ENVATO_GUIDE}
          loggedIn={Boolean(user)}
          appHref={appHref}
        />
      </div>

      {/* Magnific — panel + tutorial */}
      <LandingProviderGuide
        provider={MAGNIFIC_GUIDE}
        loggedIn={Boolean(user)}
        appHref={appHref}
        reverse
      />

      <section className="py-10 sm:py-14" aria-label="Beneficios">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6">
          {[
            {
              icon: ShieldCheck,
              title: "Sesión sincronizada",
              body: "El worker mantiene la sesión lista para cada proveedor.",
            },
            {
              icon: MonitorSmartphone,
              title: "Control de dispositivos",
              body: "1 cupo incluido; amplía por WhatsApp si cambias de equipo.",
            },
            {
              icon: Sparkles,
              title: "Todo en un dominio",
              body: "Landing, login y paneles en michitech.digital.",
            },
          ].map((item, i) => (
            <LandingReveal key={item.title} delay={i * 80} variant="scale">
              <div className="mich-soft-card mich-lp-hover-lift h-full p-5">
                <item.icon className="size-5 text-[var(--mich-blue)]" />
                <h3 className="font-heading mt-3 text-base font-semibold tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--mich-muted)]">
                  {item.body}
                </p>
              </div>
            </LandingReveal>
          ))}
        </div>
      </section>

      <section
        id="planes"
        className="scroll-mt-24 py-16 sm:py-24"
        aria-labelledby="planes-title"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
              Planes y precios
            </p>
            <h2
              id="planes-title"
              className="font-heading mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
            >
              Empieza gratis. Escala cuando quieras.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mich-muted)]">
              Base S/ {MONTHLY_PRICE_SOLES} o ${MONTHLY_PRICE_USD} USD / mes · 1
              dispositivo incluido · extra +S/ {EXTRA_DEVICE_MONTHLY_SOLES} / $
              {EXTRA_DEVICE_MONTHLY_USD} USD. Activación por WhatsApp.
            </p>
          </LandingReveal>

          <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 lg:grid-cols-3">
            {PLAN_KEYS.map((key, i) => {
              const plan = SUBSCRIPTION_PLANS[key]
              const total = planTotalSoles(key)
              const save = planSavingsSoles(key)
              const perMonth = planPerMonthSoles(key)
              return (
                <LandingReveal key={key} delay={i * 90} variant="scale">
                  <article
                    className={cn(
                      "mich-soft-card mich-lp-hover-lift relative flex h-full flex-col p-5 sm:p-6",
                      plan.highlight &&
                        "border-[var(--mich-blue)]/45 shadow-[0_24px_50px_-28px_var(--mich-glow)]"
                    )}
                  >
                    {plan.highlight ? (
                      <span className="absolute right-4 top-4 rounded-full bg-[linear-gradient(135deg,var(--mich-blue),var(--mich-indigo))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                        Recomendado
                      </span>
                    ) : null}
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mich-blue-bright)]">
                      {plan.tagline}
                    </p>
                    <h3 className="font-heading mt-2 text-2xl font-semibold tracking-[-0.03em]">
                      {plan.label}
                    </h3>
                    <p className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em]">
                      S/ {total}
                    </p>
                    <p className="mt-1 font-heading text-xl font-semibold text-[var(--mich-blue-bright)]">
                      ${planTotalUsd(key)} USD
                    </p>
                    <p className="mt-1 text-sm text-[var(--mich-muted)]">
                      ≈ S/ {perMonth}/mes · ${planPerMonthUsd(key)} USD/mes
                      {save > 0 ? ` · ahorras S/ ${save}` : ""}
                    </p>
                    <ul className="mt-6 space-y-2 text-sm text-[var(--mich-muted)]">
                      <li className="flex items-center gap-2">
                        <Check className="size-4 text-[var(--mich-blue)]" />
                        Descargas ilimitadas
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="size-4 text-[var(--mich-blue)]" />
                        1 dispositivo incluido
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="size-4 text-[var(--mich-blue)]" />
                        Acceso a Envato y a Magnific
                      </li>
                    </ul>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        buttonVariants({
                          variant: plan.highlight ? "default" : "outline",
                        }),
                        "mt-8 w-full justify-center rounded-xl"
                      )}
                    >
                      <MessageCircle />
                      Pedir por WhatsApp
                    </a>
                  </article>
                </LandingReveal>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 py-16 sm:py-24"
        aria-labelledby="faq-title"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <LandingReveal className="text-center">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
              FAQ
            </p>
            <h2
              id="faq-title"
              className="font-heading mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
            >
              Preguntas frecuentes
            </h2>
          </LandingReveal>
          <div className="mt-10 space-y-3">
            {FAQ.map((item, i) => (
              <LandingReveal key={item.q} delay={i * 40}>
                <details className="mich-soft-card group open:border-[var(--mich-blue)]/30 open:shadow-[0_16px_40px_-28px_var(--mich-glow)]">
                  <summary className="cursor-pointer list-none px-4 py-4 font-heading text-[15px] font-semibold tracking-[-0.02em] marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span className="text-[var(--mich-muted)] transition duration-300 group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="border-t border-[var(--mich-border)] px-4 py-4 text-sm leading-6 text-[var(--mich-muted)] sm:px-5">
                    {item.a}
                  </p>
                </details>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24" aria-labelledby="cta-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal variant="scale">
            <div className="mich-page-card relative overflow-hidden px-5 py-12 text-center sm:px-10 sm:py-16">
              <div
                aria-hidden
                className="mich-lp-aurora pointer-events-none absolute inset-0 opacity-70"
              />
              <div className="relative z-10 mx-auto max-w-xl">
                <ShieldCheck className="mx-auto size-9 text-[var(--mich-blue)]" />
                <h2
                  id="cta-title"
                  className="font-heading mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
                >
                  ¿Listo para Envato o Magnific?
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-[var(--mich-muted)]">
                  Crea tu cuenta, elige el panel que necesitas y sigue el
                  tutorial de ese proveedor.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={user ? appHref : "/register"}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "mich-lp-cta h-12 rounded-2xl px-7"
                    )}
                  >
                    {user ? "Ir al panel" : "Crear cuenta gratis"}
                    <ArrowRight />
                  </Link>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-12 rounded-2xl px-7"
                    )}
                  >
                    <MessageCircle />
                    WhatsApp {SITE.whatsapp.display}
                  </a>
                </div>
              </div>
            </div>
          </LandingReveal>
        </div>
      </section>

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
            <a href="#envato" className="hover:text-[var(--mich-text)]">
              Envato
            </a>
            <a href="#magnific" className="hover:text-[var(--mich-text)]">
              Magnific
            </a>
            <a href="#planes" className="hover:text-[var(--mich-text)]">
              Planes
            </a>
            <a href="#faq" className="hover:text-[var(--mich-text)]">
              FAQ
            </a>
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
    </div>
  )
}
