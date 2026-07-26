/**
 * Catálogo de proveedores de recursos.
 * Añadir uno nuevo: entrada aquí + seed de sesión/recording + (opcional) reglas.
 */

export const RESOURCE_PROVIDERS = ["ENVATO", "MAGNIFIC"] as const

export type ResourceProviderId = (typeof RESOURCE_PROVIDERS)[number]

export type ProviderDefinition = {
  id: ResourceProviderId
  /** Carpeta de perfil Playwright */
  slug: "envato" | "magnific"
  label: string
  shortLabel: string
  loginUrl: string
  /** Hosts válidos para URLs de producto / grabación */
  hosts: readonly string[]
  sampleUrlPlaceholder: string
  logoSrc: string
  dashboardPath: string
}

export const PROVIDERS: Record<ResourceProviderId, ProviderDefinition> = {
  ENVATO: {
    id: "ENVATO",
    slug: "envato",
    label: "Envato Elements",
    shortLabel: "Envato",
    loginUrl: "https://elements.envato.com/es/sign-in",
    hosts: ["elements.envato.com"],
    sampleUrlPlaceholder: "https://elements.envato.com/es/free-files",
    logoSrc: "/envato.png",
    dashboardPath: "/envato",
  },
  MAGNIFIC: {
    id: "MAGNIFIC",
    slug: "magnific",
    label: "Magnific",
    shortLabel: "Magnific",
    loginUrl: "https://www.magnific.com/log-in?client_id=magnific&lang=en",
    hosts: ["magnific.com", "www.magnific.com"],
    sampleUrlPlaceholder: "https://www.magnific.com/",
    logoSrc: "/magnific.png",
    dashboardPath: "/magnific",
  },
}

export function isResourceProviderId(value: string): value is ResourceProviderId {
  return (RESOURCE_PROVIDERS as readonly string[]).includes(value)
}

export function parseProviderId(
  value: FormDataEntryValue | string | null | undefined
): ResourceProviderId | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  return isResourceProviderId(normalized) ? normalized : null
}

export function requireProviderId(
  value: FormDataEntryValue | string | null | undefined
): ResourceProviderId {
  const id = parseProviderId(value)
  if (!id) {
    throw new Error("Proveedor inválido. Elige Envato o Magnific.")
  }
  return id
}

export function getProvider(id: ResourceProviderId): ProviderDefinition {
  return PROVIDERS[id]
}

export function isUrlForProvider(id: ResourceProviderId, url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return PROVIDERS[id].hosts.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    )
  } catch {
    return false
  }
}

export function providerList(): ProviderDefinition[] {
  return RESOURCE_PROVIDERS.map((id) => PROVIDERS[id])
}
