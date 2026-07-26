import Link from "next/link"
import { Plus, ShieldCheck } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { hasPermission, requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Roles y permisos
          </h1>
          <p className="text-muted-foreground">
            Define qué módulos y acciones puede utilizar cada rol.
          </p>
        </div>
        {hasPermission(actor.permissions, PERMISSIONS.ROLES_CREATE) ? (
          <Link href="/roles/new" className={buttonVariants()}>
            <Plus />
            Nuevo rol
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Link key={role.id} href={`/roles/${role.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {role.isSystem ? <ShieldCheck className="size-4" /> : null}
                  {role.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {role.description || "Sin descripción"}
                </p>
                <p className="text-xs">
                  {role._count.users} usuarios · {role._count.permissions} permisos
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
