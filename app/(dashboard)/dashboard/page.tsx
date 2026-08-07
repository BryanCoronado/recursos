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
import { cn } from "@/lib/utils"

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
            Cupo, descargas y avisos en vivo desde la barra superior.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {hasPermission(user.permissions, PERMISSIONS.ENVATO_ACCESS) ? (
          <ResourceCard
            href="/envato"
            title="Envato"
            description="Panel separado · historial y cupo propios."
            logoSrc="/envato.png"
          />
        ) : null}
        {hasPermission(user.permissions, PERMISSIONS.MAGNIFIC_ACCESS) ? (
          <ResourceCard
            href="/magnific"
            title="Magnific"
            description="Panel separado · historial y cupo propios."
            logoSrc="/magnific.png"
          />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Usuarios" value={users} icon={Users} />
        <MetricCard
          title="Usuarios activos"
          value={activeUsers}
          icon={UserCheck}
        />
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
      className="mich-page-card mich-lp-hover-lift group relative flex items-center gap-4 p-5 transition sm:p-6"
    >
      <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-2.5 shadow-[var(--mich-shadow-soft)]">
        <Image
          src={logoSrc}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="size-10 object-contain"
        />
      </span>
      <div className="relative z-10 min-w-0 flex-1">
        <h2 className="font-heading text-xl font-semibold tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--mich-muted)]">{description}</p>
      </div>
      <ArrowUpRight className="relative z-10 size-5 shrink-0 text-[var(--mich-muted)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--mich-blue-bright)]" />
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
    <div className="mich-soft-card mich-lp-hover-lift px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mich-muted)]">
          {title}
        </p>
        <Icon className="size-4 text-[var(--mich-blue)]" />
      </div>
      <p
        className={cn(
          "font-heading mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)]"
        )}
      >
        {value}
      </p>
    </div>
  )
}
