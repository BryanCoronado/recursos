import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/envato",
          "/magnific",
          "/sync",
          "/users",
          "/roles",
          "/audit",
          "/downloads",
          "/subscriptions",
          "/automations",
          "/devices",
          "/recharge",
          "/go",
          "/complete-profile",
          "/change-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
