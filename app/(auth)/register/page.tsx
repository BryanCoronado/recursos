import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { authOptions } from "@/lib/auth/config"

export const metadata: Metadata = {
  title: "Crear cuenta gratis | Descargar Envato Elements",
  description:
    "Regístrate en MICHITECH y descarga Envato Elements. 2 descargas gratis. Membresías desde S/ 15 o $5 USD al mes en Perú.",
  alternates: { canonical: "/register" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Crear cuenta MICHITECH",
    description:
      "Empieza gratis: Envato Elements con tutorial, historial y progreso en vivo.",
    url: "/register",
  },
}

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/go")

  return (
    <AuthShell
      headline="Empieza gratis en minutos."
      subline="Crea tu cuenta para Envato Elements. 2 descargas de prueba y membresía cuando la necesites."
      formTitle="Crear cuenta"
      formSubtitle="Registro rápido. Sin tarjeta."
    >
      <RegisterForm />
    </AuthShell>
  )
}
