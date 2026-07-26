import { PrismaMariaDb } from "@prisma/adapter-mariadb"

/**
 * Crea el adapter MariaDB con pool acotado para no saturar max_connections.
 */
export function createMariaDbAdapter(connectionLimit = 5) {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada")
  }

  const url = new URL(connectionString)
  const database = url.pathname.replace(/^\//, "").split("?")[0] || undefined

  return new PrismaMariaDb({
    host: url.hostname || "127.0.0.1",
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit,
    acquireTimeout: 20_000,
    connectTimeout: 10_000,
  })
}
