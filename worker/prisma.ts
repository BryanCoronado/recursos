import { config } from "dotenv"

import { PrismaClient } from "../lib/generated/prisma/client"
import { createMariaDbAdapter } from "../lib/prisma-adapter"

config({ path: ".env" })
config({ path: ".env.local", override: true })

export const prisma = new PrismaClient({
  adapter: createMariaDbAdapter(3),
})
