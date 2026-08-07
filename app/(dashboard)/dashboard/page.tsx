import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, Shield, UserCheck, Users } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import {
  getCurrentUser,
  hasPermission,
  requirePagePermission,
} from "@/lib/auth/authorization"
import { resolveHomePath } from "@/lib/auth/home-path"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const access = await requirePagePermission(PERMISSIONS.DASHBOARD_ACCESS)
  if (!access.allowed || !access.user) {
    const user = await getCurrentUser()
    if (user) {
      const home = resolveHomePath(user.permissions)
      if (home !== "/dashboard") redirect(home)
    }
    return <AccessDenied moduleName="Panel" />
  }

  const user = access.user
  const [users, activeUsers, roles] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.role.count(),
  ])

  return (
    <div className="space-y-8">
      <section className="mich-page-card relative px-6 py-8 sm:px-8">
        <div className="relative z-10">
          <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
            Workspace
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-4xl">
            Hola, {user.name}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-6 text-[var(--mich-muted)]">
            Tus recursos y accesos en un solo lugar.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {hasPermission(user.permissions, PERMISSIONS.ENVATO_ACCESS) ? (
          <ResourceCard
            href="/envato"
            title="Envato"
            description="Accede al módulo de recursos de Envato."
            logoSrc="/envato.png"
          />
        ) : null}
        {hasPermission(user.permissions, PERMISSIONS.MAGNIFIC_ACCESS) ? (
          <ResourceCard
            href="/magnific"
            title="Magnific"
            description="Accede al módulo de recursos de Magnific."
            logoSrc="/magnific.png"
          />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Usuarios" value={users} icon={Users} />
        <MetricCard title="Usuarios activos" value={activeUsers} icon={UserCheck} />
        <MetricCard title="Roles" value={roles} icon={Shield} />
      </div>
    </div>
  )
}

function ResourceCard({
  href,
  title,
  description,
  logoSrc,
}: {
  href: string
  title: string
  description: string
  logoSrc: string
}) {
  return (
    <Link
      href={href}
      className="group mich-soft-card relative overflow-hidden p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--mich-blue)]/45 hover:shadow-[0_20px_50px_-28px_var(--mich-glow)]"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-12 items-center justify-center overflow-hidden rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-1.5 shadow-sm">
          <Image
            src={logoSrc}
            alt={title}
            width={40}
            height={40}
            unoptimized
            className="size-9 object-contain"
          />
        </span>
        <ArrowUpRight className="size-5 text-[var(--mich-muted)]/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--mich-blue-bright)]" />
      </div>
      <h2 className="font-heading mt-8 text-xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-[var(--mich-muted)]">
        {description}
      </p>
    </Link>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number
  icon: typeof Users
}) {
  return (
    <div className="mich-soft-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--mich-muted)]">{title}</p>
        <Icon className="size-4 text-[var(--mich-blue)]" />
      </div>
      <p className="font-heading mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)]">
        {value}
      </p>
    </div>
  )
}
