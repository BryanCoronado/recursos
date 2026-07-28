import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // En VPS con poca RAM el paso "Running TypeScript" puede colgarse.
  // El tipado se valida en local / CI; el build de prod no debe bloquearse.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Los perfiles Chromium en storage/ (miles de archivos) no deben entrar al bundle/trace.
  outputFileTracingExcludes: {
    "*": [
      "./storage/**/*",
      "./storage/browser/**/*",
      "./storage/downloads/**/*",
    ],
  },
}

export default nextConfig
