import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { config } from "dotenv"

import { PrismaClient } from "../lib/generated/prisma/client"

config({ path: ".env" })
config({ path: ".env.local", override: true })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada")
}

export const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(connectionString),
})
