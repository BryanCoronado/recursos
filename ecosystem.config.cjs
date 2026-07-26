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
      },
    },
  ],
}
