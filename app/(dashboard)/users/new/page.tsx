import { AccessDenied } from "@/components/auth/access-denied"
import { UserForm } from "@/components/admin/user-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

import { createUser } from "../actions"

export default async function NewUserPage() {
  const access = await requirePagePermission(PERMISSIONS.USERS_CREATE)
  if (!access.allowed) return <AccessDenied moduleName="Usuarios" />
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          Nuevo usuario
        </h1>
        <p className="text-muted-foreground">
          La cuenta deberá cambiar su contraseña en el primer acceso.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos y roles</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm action={createUser} roles={roles} />
        </CardContent>
      </Card>
    </div>
  )
}
