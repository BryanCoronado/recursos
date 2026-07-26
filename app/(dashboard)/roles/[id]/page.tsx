import { notFound } from "next/navigation"
import { Trash2 } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { RoleForm } from "@/components/admin/role-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { hasPermission, requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

import { deleteRole, updateRole } from "../actions"

type RoleDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const access = await requirePagePermission(PERMISSIONS.ROLES_READ)
  if (!access.allowed) return <AccessDenied moduleName="Roles y permisos" />
  const actor = access.user
  const { id } = await params
  const [role, permissions] = await Promise.all([
    prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        permissions: { select: { permissionId: true, permission: true } },
        _count: { select: { users: true } },
      },
    }),
    prisma.permission.findMany({
      where: { key: { in: actor.permissions } },
      orderBy: [{ module: "asc" }, { label: "asc" }],
      select: { id: true, key: true, module: true, label: true },
    }),
  ])
  if (!role) notFound()

  const canUpdate =
    !role.isSystem &&
    hasPermission(actor.permissions, PERMISSIONS.ROLES_UPDATE)
  const canDelete =
    !role.isSystem &&
    role._count.users === 0 &&
    hasPermission(actor.permissions, PERMISSIONS.ROLES_DELETE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          {role.name}
        </h1>
        <p className="text-muted-foreground">
          {role.isSystem
            ? "Rol raíz protegido; no puede modificarse."
            : `${role._count.users} usuarios asignados.`}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{canUpdate ? "Editar rol" : "Permisos asignados"}</CardTitle>
        </CardHeader>
        <CardContent>
          {canUpdate ? (
            <RoleForm
              action={updateRole}
              permissions={permissions}
              role={{
                id: role.id,
                name: role.name,
                description: role.description ?? "",
                permissionIds: role.permissions.map(({ permissionId }) => permissionId),
              }}
            />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {role.permissions.map(({ permission }) => (
                <li key={permission.id} className="rounded-lg border p-3 text-sm">
                  {permission.label}
                  <span className="block font-mono text-xs text-muted-foreground">
                    {permission.key}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {canDelete ? (
        <form action={deleteRole}>
          <input type="hidden" name="roleId" value={role.id} />
          <Button type="submit" variant="destructive">
            <Trash2 />
            Eliminar rol
          </Button>
        </form>
      ) : null}
    </div>
  )
}
