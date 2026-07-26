import { AccessDenied } from "@/components/auth/access-denied"
import { ResourceInput } from "@/components/resources/resource-input"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"

export default async function MagnificPage() {
  const access = await requirePagePermission(PERMISSIONS.MAGNIFIC_ACCESS)
  if (!access.allowed) return <AccessDenied moduleName="Magnific" />

  return (
    <ResourceInput
      name="Magnific"
      description="Introduce el recurso de Magnific con el que deseas trabajar."
      placeholder="Escribe o pega aquí..."
      logoSrc="/magnific.png"
      logoAlt="Magnific"
    />
  )
}
