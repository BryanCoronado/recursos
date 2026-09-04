module.exports = {
  apps: [
    {
      name: "recursos-web",
      cwd: "/var/www/recursos",
      script: "node_modules/next/dist/bin/next",
      args: ["start", "-p", "3000"],
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "recursos-worker",
      cwd: "/var/www/recursos",
      script: "node_modules/tsx/dist/cli.mjs",
      args: ["worker/index.ts"],
      env: {
        NODE_ENV: "production",
        // Obligatoria para Chromium headed + Xvfb
        DISPLAY: ":99",
        // Descargas en paralelo (pestañas del mismo Chromium por proveedor).
        // Subirlo consume más RAM y arriesga que el proveedor limite la cuenta.
        WORKER_MAX_DOWNLOADS: "4",
        WORKER_MAX_DOWNLOADS_PER_PROVIDER: "4",
        // Freno por RAM: no abre otra pestaña si quedan menos de estos MB
        WORKER_MIN_FREE_MB: "500",
        WORKER_TAB_MEMORY_MB: "350",
        // Cierra el Chromium tras 2 min sin descargas (libera RAM y el perfil)
        WORKER_BROWSER_IDLE_MS: "120000",
      },
    },
  ],
}
