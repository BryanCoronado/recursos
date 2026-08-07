/**
 * Datos públicos del sitio (landing + SEO).
 * Solo usar NEXT_PUBLIC_* aquí para que SSR y cliente coincidan.
 */
export const SITE = {
  name: "MICHITECH",
  legalName: "MICHITECH Recursos",
  tagline: "Descarga Envato y Magnific desde un solo panel",
  description:
    "Descarga recursos de Envato Elements y Magnific desde un solo panel en michitech.digital. Historial, progreso en vivo, membresías y prueba gratis. Sin subdominios.",
  /** Dominio canónico público (SEO / OG). No uses NEXTAUTH_URL: no está en el cliente. */
  url: (
    process.env.NEXT_PUBLIC_SITE_URL || "https://michitech.digital"
  ).replace(/\/$/, ""),
  host: (
    process.env.NEXT_PUBLIC_SITE_URL || "https://michitech.digital"
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, ""),
  locale: "es_PE",
  whatsapp: {
    phone: "51917080235",
    display: "+51 917 080 235",
  },
} as const

export function absoluteUrl(path = "/") {
  const base = SITE.url
  if (!path || path === "/") return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}
