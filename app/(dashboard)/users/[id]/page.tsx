import { notFound } from "next/navigation"

import { AccessDenied } from "@/components/auth/access-denied"
import { ResetPasswordForm } from "@/components/admin/reset-password-form"
import { UserForm } from "@/components/admin/user-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { hasPermission, requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

import { setUserStatus, updateUser } from "../actions"

type UserDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const access = await requirePagePermission(PERMISSIONS.USERS_READ)
  if (!access.allowed) return <AccessDenied moduleName="Usuarios" />
  const actor = access.user
  const { id } = await params
  const [user, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roles: { select: { roleId: true } },
      },
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    }),
  ])
  if (!user) notFound()

  const canUpdate = hasPermission(actor.permissions, PERMISSIONS.USERS_UPDATE)
  const canSetStatus = hasPermission(actor.permissions, PERMISSIONS.USERS_STATUS)
  const canReset = hasPermission(
    actor.permissions,
    PERMISSIONS.USERS_RESET_PASSWORD
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          {user.name}
        </h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      {canUpdate ? (
        <Card>
          <CardHeader>
            <CardTitle>Datos y roles</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm
              action={updateUser}
              roles={roles}
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                roleIds: user.roles.map(({ roleId }) => roleId),
              }}
            />
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {canSetStatus ? (
          <Card>
            <CardHeader>
              <CardTitle>Estado de la cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Estado actual: {user.status}
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusForm userId={user.id} status="ACTIVE" label="Activar" />
                <StatusForm userId={user.id} status="INACTIVE" label="Desactivar" />
                <StatusForm
                  userId={user.id}
                  status="SUSPENDED"
                  label="Suspender"
                  destructive
                />
              </div>
            </CardContent>
          </Card>
        ) : null}
        {canReset ? (
          <Card>
            <CardHeader>
              <CardTitle>Restablecer contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm userId={user.id} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function StatusForm({
  userId,
  status,
  label,
  destructive,
}: {
  userId: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  label: string
  destructive?: boolean
}) {
  return (
    <form action={setUserStatus}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        variant={destructive ? "destructive" : "outline"}
        size="sm"
      >
        {label}
      </Button>
    </form>
  )
}
