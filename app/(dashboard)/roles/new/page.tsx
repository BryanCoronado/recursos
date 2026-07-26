import { AccessDenied } from "@/components/auth/access-denied"
import { RoleForm } from "@/components/admin/role-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

import { createRole } from "../actions"

export default async function NewRolePage() {
  const access = await requirePagePermission(PERMISSIONS.ROLES_CREATE)
  if (!access.allowed) return <AccessDenied moduleName="Roles y permisos" />
  const actor = access.user
  const permissions = await prisma.permission.findMany({
    where: { key: { in: actor.permissions } },
    orderBy: [{ module: "asc" }, { label: "asc" }],
    select: { id: true, key: true, module: true, label: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          Nuevo rol
        </h1>
        <p className="text-muted-foreground">
          Solo puedes conceder permisos que ya posees.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos y permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleForm action={createRole} permissions={permissions} />
        </CardContent>
      </Card>
    </div>
  )
}
