import Link from "next/link"

import type { BlogPost } from "@/lib/blog/posts"
import { cn } from "@/lib/utils"

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function BlogCard({
  post,
  featured = false,
}: {
  post: BlogPost
  featured?: boolean
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "mich-soft-card mich-hover-card group flex h-full flex-col p-5 sm:p-6",
        featured && "sm:p-7"
      )}
    >
      <div className="flex items-center gap-2 text-[12px] text-[var(--mich-muted)]">
        <span className="font-medium text-[var(--mich-blue-bright)]">
          {post.category}
        </span>
        <span aria-hidden>·</span>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden>·</span>
        <span>{post.readingMinutes} min</span>
      </div>
      <h3
        className={cn(
          "font-heading mt-3 font-semibold tracking-[-0.03em] text-[var(--mich-text)] group-hover:text-[var(--mich-blue-bright)]",
          featured ? "text-2xl sm:text-[1.7rem]" : "text-lg sm:text-xl"
        )}
      >
        {post.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--mich-muted)]">
        {post.excerpt}
      </p>
      <span className="mt-4 text-sm font-medium text-[var(--mich-blue-bright)]">
        Leer guía →
      </span>
    </Link>
  )
}
