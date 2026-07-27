import { NextResponse } from "next/server"

import {
  AuthorizationError,
  getCurrentUser,
  hasPermission,
} from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { parseProviderId } from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"

/**
 * Cierra grabación al salir/refrescar la página.
 * El worker detecta status != RECORDING y cierra Chromium.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    if (!hasPermission(user.permissions, PERMISSIONS.AUTOMATIONS_MANAGE)) {
      throw new AuthorizationError()
    }

    let providerRaw: string | null = null
    const contentType = request.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as {
        provider?: string
      } | null
      providerRaw = body?.provider ?? null
    } else {
      const form = await request.formData().catch(() => null)
      const value = form?.get("provider")
      providerRaw = typeof value === "string" ? value : null
    }

    const provider = parseProviderId(providerRaw)
    if (!provider) {
      return NextResponse.json({ error: "Proveedor inválido" }, { status: 400 })
    }

    await prisma.automationRecording.updateMany({
      where: {
        provider,
        status: { in: ["RECORDING", "STOPPED"] },
      },
      data: {
        status: "IDLE",
        steps: [],
        nextClickIsDownload: false,
        recordToken: null,
        lastError: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: "Error al cerrar grabación" }, { status: 500 })
  }
}
