import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react"

import { BlogBlocks } from "@/components/marketing/blog-blocks"
import { BlogCard } from "@/components/marketing/blog-card"
import { LandingNav } from "@/components/marketing/landing-nav"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/authorization"
import { resolveHomePath } from "@/lib/auth/home-path"
import {
  FREE_DOWNLOAD_LIMIT,
  MONTHLY_PRICE_SOLES,
  MONTHLY_PRICE_USD,
} from "@/lib/billing/plans"
import {
  getAllPosts,
  getPost,
  getRelatedPosts,
} from "@/lib/blog/posts"
import { SITE, absoluteUrl, whatsappInfoUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: "Artículo no encontrado" }

  const url = absoluteUrl(`/blog/${post.slug}`)
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    robots: { index: true, follow: true },
  }
}

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const user = await getCurrentUser()
  const appHref = user ? resolveHomePath(user.permissions) : "/go"
  const wa = whatsappInfoUrl(
    `Hola, leí “${post.title}” y quiero información sobre MICHITECH.`
  )
  const related = getRelatedPosts(post)
  const url = absoluteUrl(`/blog/${post.slug}`)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: "es-PE",
        mainEntityOfPage: url,
        url,
        author: {
          "@type": "Organization",
          name: SITE.legalName,
          url: SITE.url,
        },
        publisher: {
          "@type": "Organization",
          name: SITE.legalName,
          url: SITE.url,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/icon-512.png"),
          },
        },
        keywords: post.keywords.join(", "),
        articleSection: post.category,
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
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: url,
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
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--mich-muted)] transition hover:text-[var(--mich-text)]"
          >
            <ArrowLeft className="size-3.5" />
            Blog
          </Link>

          <p className="mt-6 text-[13px] font-medium text-[var(--mich-blue-bright)]">
            {post.category}
          </p>
          <h1 className="font-heading mt-2 text-[2rem] font-semibold leading-[1.15] tracking-[-0.04em] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-[16px] leading-7 text-[var(--mich-muted)]">
            {post.excerpt}
          </p>
          <p className="mt-4 text-[13px] text-[var(--mich-muted)]">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden> · </span>
            {post.readingMinutes} min de lectura
          </p>

          <div className="mt-10">
            <BlogBlocks blocks={post.blocks} />
          </div>

          <div className="mich-page-card mt-12 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--mich-blue)_12%,var(--mich-surface)),var(--mich-surface))] p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
              Prueba {FREE_DOWNLOAD_LIMIT} descargas gratis
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--mich-muted)]">
              Luego la membresía desde S/ {MONTHLY_PRICE_SOLES} o $
              {MONTHLY_PRICE_USD} USD al mes. Activación por WhatsApp el mismo
              día.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={user ? appHref : "/register"}
                className={cn(
                  buttonVariants(),
                  "rounded-2xl transition-transform hover:-translate-y-0.5"
                )}
              >
                {user ? "Ir al panel" : "Crear cuenta"}
                <ArrowRight />
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-2xl"
                )}
              >
                <MessageCircle />
                WhatsApp
              </a>
            </div>
          </div>
        </article>

        {related.length ? (
          <section className="border-t border-[var(--mich-border)] py-14 sm:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
                Sigue leyendo
              </h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {related.map((item) => (
                  <BlogCard key={item.slug} post={item} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <MarketingFooter wa={wa} />
    </div>
  )
}
