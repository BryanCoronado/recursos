import { AccessDenied } from "@/components/auth/access-denied"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export default async function AuditPage() {
  const access = await requirePagePermission(PERMISSIONS.AUDIT_READ)
  if (!access.allowed) return <AccessDenied moduleName="Auditoría" />
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      actor: { select: { name: true, email: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          Auditoría
        </h1>
        <p className="text-muted-foreground">
          Últimos cambios sensibles de usuarios y roles.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Últimos 100 eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Entidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Intl.DateTimeFormat("es", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.actor?.name ?? "Sistema"}
                    {log.actor ? (
                      <p className="text-xs text-muted-foreground">
                        {log.actor.email}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell>
                    {log.entityType}
                    {log.entityId ? (
                      <p className="max-w-40 truncate font-mono text-xs text-muted-foreground">
                        {log.entityId}
                      </p>
                    ) : null}
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
