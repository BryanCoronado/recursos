import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { authOptions } from "@/lib/auth/config"

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Entra a tu panel MICHITECH para descargar Envato Elements o Magnific.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
}

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions)
  if (session) redirect("/go")

  const params = await searchParams
  const raw = params.callbackUrl
  const callbackUrl =
    raw?.startsWith("/") &&
    !raw.startsWith("//") &&
    raw !== "/" &&
    raw !== "/login" &&
    raw !== "/register"
      ? raw
      : "/go"
  const justRegistered = params.registered === "1"

  return (
    <AuthShell
      headline="Tu panel de recursos, listo."
      subline="Descargas Envato y Magnific con progreso en vivo, cada uno en su módulo."
      formTitle="Iniciar sesión"
      formSubtitle="Entra con tu correo y contraseña."
    >
      {justRegistered ? (
        <p className="mich-auth-rise mb-5 rounded-2xl border border-[color-mix(in_srgb,var(--mich-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_12%,transparent)] px-3.5 py-3 text-[13px] leading-5 text-[var(--mich-success)]">
          Cuenta creada correctamente. Ya puedes entrar.
        </p>
      ) : null}
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
