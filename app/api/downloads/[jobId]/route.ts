import { createReadStream } from "node:fs"
import { access, constants, stat } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"

import { NextResponse } from "next/server"

import {
  AuthorizationError,
  getCurrentUser,
  hasPermission,
} from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { DOWNLOADS_ROOT } from "@/lib/storage/paths"

type RouteContext = {
  params: Promise<{ jobId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    if (!hasPermission(user.permissions, PERMISSIONS.ENVATO_ACCESS)) {
      throw new AuthorizationError()
    }

    const { jobId } = await context.params

    const job = await prisma.downloadJob.findFirst({
      where: {
        id: jobId,
        provider: "ENVATO",
        requestedById: user.id,
        status: "DONE",
      },
    })

    if (!job?.filePath || !job.fileName) {
      return NextResponse.json(
        { error: "Archivo no disponible" },
        { status: 404 }
      )
    }

    const resolved = path.resolve(job.filePath)
    const downloadsRoot = path.resolve(DOWNLOADS_ROOT)
    if (
      resolved !== downloadsRoot &&
      !resolved.startsWith(downloadsRoot + path.sep)
    ) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
    }

    await access(resolved, constants.R_OK)
    const fileStat = await stat(resolved)
    const stream = createReadStream(resolved)
    const asciiName = job.fileName.replace(/[^\x20-\x7E]/g, "_")

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(job.fileName)}`,
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "No se pudo entregar el archivo" },
      { status: 500 }
    )
  }
}
