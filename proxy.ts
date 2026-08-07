import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register"
  )
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const publicPath = isPublicPath(pathname)

  // Landing + login/register: accesibles sin sesión
  if (!token && publicPath) {
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // Sesión activa: no quedarse en login/register
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/go", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
