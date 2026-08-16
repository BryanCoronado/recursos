import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — Envato Elements y Magnific`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#080e18",
    theme_color: "#4f8fe8",
    lang: "es-PE",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
