import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const { pathname, search } = request.nextUrl
  const isLogin = pathname === "/login"
  const isAuthApi = pathname.startsWith("/api/auth")

  if (isAuthApi) return NextResponse.next()

  if (!token && !isLogin) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
