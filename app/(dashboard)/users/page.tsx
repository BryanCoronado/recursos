import Link from "next/link"
import { Plus } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const statusLabel = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  SUSPENDED: "Suspendido",
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
      status: true,
      lastLoginAt: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Usuarios
          </h1>
          <p className="text-muted-foreground">
            Cuentas, estados y roles asignados.
          </p>
        </div>
        {hasPermission(actor.permissions, PERMISSIONS.USERS_CREATE) ? (
          <Link href="/users/new" className={buttonVariants()}>
            <Plus />
            Nuevo usuario
          </Link>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{users.length} usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Último acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/users/${user.id}`} className="font-medium hover:underline">
                      {user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell>{statusLabel[user.status]}</TableCell>
                  <TableCell>
                    {user.roles.map(({ role }) => role.name).join(", ") || "Sin rol"}
                  </TableCell>
                  <TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
