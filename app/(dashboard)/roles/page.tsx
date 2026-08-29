import Link from "next/link"
import { Plus, ShieldCheck } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { hasPermission, requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export default async function RolesPage() {
  const access = await requirePagePermission(PERMISSIONS.ROLES_READ)
  if (!access.allowed) return <AccessDenied moduleName="Roles y permisos" />
  const actor = access.user
  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
      _count: { select: { users: true, permissions: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-3xl">
            Roles y permisos
          </h1>
          <p className="mt-1.5 text-sm text-[var(--mich-muted)]">
            Define qué módulos y acciones puede utilizar cada rol.
          </p>
        </div>
          {hasPermission(actor.permissions, PERMISSIONS.ROLES_CREATE) ? (
            <Link
              href="/roles/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              <Plus />
              Nuevo rol
            </Link>
          ) : null}
        </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Link
            key={role.id}
            href={`/roles/${role.id}`}
            className="mich-soft-card group block p-5 transition-colors hover:border-[var(--mich-blue)]/35"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
                {role.name}
              </h2>
              {role.isSystem ? (
                <span className="mich-chip mich-chip-ok">
                  <ShieldCheck className="size-3" />
                  Sistema
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-[var(--mich-muted)]">
              {role.description || "Sin descripción"}
            </p>
            <p className="mt-4 text-xs text-[var(--mich-muted)]">
              {role._count.users} usuarios · {role._count.permissions} permisos
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
