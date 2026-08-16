/**
 * Datos públicos del sitio (landing + SEO).
 * Solo usar NEXT_PUBLIC_* aquí para que SSR y cliente coincidan.
 */
export const SITE = {
  name: "MICHITECH",
  legalName: "MICHITECH Recursos",
  tagline: "Descarga Envato Elements y Magnific desde un solo panel",
  description:
    "Descarga Envato Elements y Magnific online en Perú con MICHITECH. Paneles separados, tutorial, historial y progreso en vivo. Prueba 2 descargas gratis. Membresías desde S/ 20 o $6 USD al mes.",
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
