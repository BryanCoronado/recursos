import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const { pathname, search } = request.nextUrl
  const isLogin = pathname === "/login"
  const isRegister = pathname === "/register"
  const isPublicAuth = isLogin || isRegister
  const isAuthApi = pathname.startsWith("/api/auth")

  if (isAuthApi) return NextResponse.next()

  if (!token && !isPublicAuth) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isPublicAuth) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
