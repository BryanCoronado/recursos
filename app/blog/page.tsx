import Link from "next/link"
import type { Metadata } from "next"

import { BlogCard } from "@/components/marketing/blog-card"
import { LandingNav } from "@/components/marketing/landing-nav"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/authorization"
import { resolveHomePath } from "@/lib/auth/home-path"
import { getAllPosts } from "@/lib/blog/posts"
import { SITE, absoluteUrl, whatsappInfoUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

const TITLE = "Blog | Qué es Envato Elements, Magnific y cómo descargarlos"
const DESCRIPTION =
  "Guías de MICHITECH: qué es Envato Elements, qué es Magnific, cómo descargar en Perú, precios y tutorial del panel. Contenido para decidir si te conviene la membresía."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "blog Envato Elements",
    "qué es Envato Elements",
    "qué es Magnific",
    "descargar Envato Perú",
    "tutorial MICHITECH",
  ],
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: absoluteUrl("/blog"),
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
}

export default async function BlogIndexPage() {
  const user = await getCurrentUser()
  const appHref = user ? resolveHomePath(user.permissions) : "/go"
  const wa = whatsappInfoUrl()
  const posts = getAllPosts()
  const [featured, ...rest] = posts

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${absoluteUrl("/blog")}#blog`,
        name: "Blog MICHITECH",
        description: DESCRIPTION,
        url: absoluteUrl("/blog"),
        inLanguage: "es-PE",
        publisher: {
          "@type": "Organization",
          name: SITE.legalName,
          url: SITE.url,
        },
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: absoluteUrl(`/blog/${post.slug}`),
          datePublished: post.date,
          description: post.description,
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
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: absoluteUrl("/blog"),
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
      <LandingNav loggedIn={Boolean(user)} appHref={appHref} />

      <main className="pt-16">
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--mich-blue)_16%,transparent),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-[13px] font-medium text-[var(--mich-blue-bright)]">
              Blog
            </p>
            <h1 className="font-heading mt-2 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Guías para entender Envato, Magnific y el panel.
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-7 text-[var(--mich-muted)]">
              Qué es cada proveedor, cuánto sale y cómo se pega el enlace. Sin
              relleno: para que decidas si te conviene probar las{" "}
              {posts.length ? "descargas gratis" : "descargas"} y quedarte.
            </p>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-3">
            {featured ? (
              <div className="lg:col-span-3">
                <BlogCard post={featured} featured />
              </div>
            ) : null}
            {rest.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
            <div className="mich-page-card bg-[linear-gradient(180deg,color-mix(in_srgb,var(--mich-blue)_12%,var(--mich-surface)),var(--mich-surface))] px-5 py-10 text-center sm:px-10">
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                ¿Ya te quedó claro el flujo?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--mich-muted)]">
                Crea la cuenta, prueba el panel y si el ZIP llega bien, pide el
                plan por WhatsApp.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={user ? appHref : "/register"}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 rounded-2xl px-6"
                  )}
                >
                  {user ? "Ir al panel" : "Crear cuenta gratis"}
                </Link>
                <Link
                  href="/#planes"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 rounded-2xl px-6"
                  )}
                >
                  Ver planes
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter wa={wa} />
    </div>
  )
}
