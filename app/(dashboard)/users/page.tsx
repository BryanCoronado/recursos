import Link from "next/link"
import { Plus } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { hasPermission, requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

const statusLabel = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  SUSPENDED: "Suspendido",
} as const

const statusChip = {
  ACTIVE: "mich-chip mich-chip-ok",
  INACTIVE: "mich-chip",
  SUSPENDED: "mich-chip mich-chip-danger",
} as const

export default async function UsersPage() {
  const access = await requirePagePermission(PERMISSIONS.USERS_READ)
  if (!access.allowed) return <AccessDenied moduleName="Usuarios" />
  const actor = access.user
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      country: true,
      phone: true,
      status: true,
      lastLoginAt: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-3xl">
            Usuarios
          </h1>
          <p className="mt-1.5 text-sm text-[var(--mich-muted)]">
            Cuentas, estados y roles asignados.
          </p>
        </div>
          {hasPermission(actor.permissions, PERMISSIONS.USERS_CREATE) ? (
            <Link
              href="/users/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              <Plus />
              Nuevo usuario
            </Link>
          ) : null}
        </div>

      <div className="mich-page-card overflow-hidden">
        <div className="border-b border-[var(--mich-border)] px-5 py-4">
          <p className="text-sm font-medium text-[var(--mich-text)]">
            {users.length} usuarios
          </p>
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Último acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      href={`/users/${user.id}`}
                      className="font-medium text-[var(--mich-text)] hover:underline"
                    >
                      {user.name}
                    </Link>
                    <p className="text-xs text-[var(--mich-muted)]">
                      {user.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    {user.phone ? (
                      <div>
                        <p className="text-sm text-[var(--mich-text)]">
                          {user.phone}
                        </p>
                        {user.country ? (
                          <p className="text-xs text-[var(--mich-muted)]">
                            {user.country}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--mich-muted)]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={statusChip[user.status]}>
                      {statusLabel[user.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-[var(--mich-muted)]">
                    {user.roles.map(({ role }) => role.name).join(", ") ||
                      "Sin rol"}
                  </TableCell>
                  <TableCell className="text-[var(--mich-muted)]">
                    {user.lastLoginAt
                      ? new Intl.DateTimeFormat("es", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(user.lastLoginAt)
                      : "Nunca"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
