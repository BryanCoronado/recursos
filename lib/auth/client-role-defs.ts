import { PERMISSIONS } from "@/lib/auth/permissions"
import { type ResourceProviderId } from "@/lib/providers/catalog"

/** Roles de cliente por proveedor (pueden acumularse en el mismo usuario). */
export const CLIENT_ROLE = {
  ENVATO: {
    systemKey: "CLIENT_ENVATO",
    name: "Clientes Envato",
    description:
      "Solo descarga Envato Elements, cupo gratis de Envato y recarga.",
    permissions: [PERMISSIONS.ENVATO_ACCESS, PERMISSIONS.RECHARGE_ACCESS] as const,
    envId: process.env.CLIENT_ENVATO_ROLE_ID,
  },
  MAGNIFIC: {
    systemKey: "CLIENT_MAGNIFIC",
    name: "Clientes Magnific",
    description:
      "Solo descarga Magnific, cupo gratis de Magnific y recarga.",
    permissions: [
      PERMISSIONS.MAGNIFIC_ACCESS,
      PERMISSIONS.RECHARGE_ACCESS,
    ] as const,
    envId: process.env.CLIENT_MAGNIFIC_ROLE_ID,
  },
} as const

export function clientRoleForProvider(provider: ResourceProviderId) {
  return provider === "ENVATO" ? CLIENT_ROLE.ENVATO : CLIENT_ROLE.MAGNIFIC
}

export function providerPermission(
  provider: ResourceProviderId
): (typeof PERMISSIONS)[keyof typeof PERMISSIONS] {
  return provider === "ENVATO"
    ? PERMISSIONS.ENVATO_ACCESS
    : PERMISSIONS.MAGNIFIC_ACCESS
}
