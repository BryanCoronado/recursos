import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { BlogCard } from "@/components/marketing/blog-card"
import { LandingReveal } from "@/components/marketing/landing-reveal"
import { buttonVariants } from "@/components/ui/button"
import { getPost } from "@/lib/blog/posts"
import { cn } from "@/lib/utils"

const FEATURED = [
  "que-es-envato-elements",
  "que-es-magnific",
  "como-descargar-envato-elements-en-peru",
] as const

export function LandingGuides() {
  const posts = FEATURED.map((slug) => getPost(slug)).filter(
    (post): post is NonNullable<ReturnType<typeof getPost>> => Boolean(post)
  )

  return (
    <section
      id="guias"
      className="scroll-mt-24 py-16 sm:py-24"
      aria-labelledby="guias-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[var(--mich-blue-bright)]">
                Guías
              </p>
              <h2
                id="guias-title"
                className="font-heading mt-2 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
              >
                Qué es Envato, Magnific y cómo se descarga.
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mich-muted)]">
                Contenido para decidir con calma: catálogo, precios y el flujo
                de pegar el enlace.
              </p>
            </div>
            <Link
              href="/blog"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-2xl"
              )}
            >
              Ver el blog
              <ArrowRight />
            </Link>
          </div>
        </LandingReveal>

        <div className="mt-10 grid gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-3">
          {posts.map((post, i) => (
            <LandingReveal key={post.slug} delay={i * 80} variant="scale">
              <BlogCard post={post} />
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
