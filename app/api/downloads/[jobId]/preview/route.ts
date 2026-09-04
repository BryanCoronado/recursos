import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import {
  AuthorizationError,
  getCurrentUser,
  hasPermission,
} from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { isResourceProviderId } from "@/lib/providers/catalog"
import { prisma } from "@/lib/prisma"
import { jobDownloadDir } from "@/lib/storage/paths"

type RouteContext = {
  params: Promise<{ jobId: string }>
}

const ACCESS_BY_PROVIDER = {
  ENVATO: PERMISSIONS.ENVATO_ACCESS,
  MAGNIFIC: PERMISSIONS.MAGNIFIC_ACCESS,
} as const

/**
 * Captura en vivo de la pestaña del job. Solo el dueño de la descarga (o un
 * admin) la ve: es una imagen de SU pestaña, no del escritorio del worker,
 * así que no expone las descargas de otros clientes ni permite interactuar.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { jobId } = await context.params

    const canSeeAll =
      user.isSuperAdmin ||
      hasPermission(user.permissions, PERMISSIONS.DOWNLOADS_READ) ||
      hasPermission(user.permissions, PERMISSIONS.SYNC_ACCESS)

    const job = await prisma.downloadJob.findFirst({
      where: {
        id: jobId,
        status: "RUNNING",
        ...(canSeeAll ? {} : { requestedById: user.id }),
      },
      select: { id: true, provider: true },
    })

    if (!job) {
      return NextResponse.json(
        { error: "Vista previa no disponible" },
        { status: 404 }
      )
    }

    if (!isResourceProviderId(job.provider)) {
      return NextResponse.json({ error: "Proveedor inválido" }, { status: 400 })
    }

    if (!canSeeAll) {
      const permission = ACCESS_BY_PROVIDER[job.provider]
      if (!hasPermission(user.permissions, permission)) {
        throw new AuthorizationError()
      }
    }

    // job.id viene de la base, no del parámetro: no hay traversal posible.
    const file = path.join(jobDownloadDir(job.id), "preview.jpg")
    const buffer = await readFile(file)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Vista previa no disponible" },
      { status: 404 }
    )
  }
}
