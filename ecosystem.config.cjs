module.exports = {
  apps: [
    {
      name: "recursos-web",
      cwd: "/var/www/recursos",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "recursos-worker",
      cwd: "/var/www/recursos",
      script: "npm",
      args: "run worker",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
