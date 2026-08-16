import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { authOptions } from "@/lib/auth/config"

export const metadata: Metadata = {
  title: "Crear cuenta gratis | Descargar Envato Elements y Magnific",
  description:
    "Regístrate en MICHITECH y descarga Envato Elements o Magnific. 2 descargas gratis. Membresías desde S/ 20 o $6 USD al mes en Perú.",
  alternates: { canonical: "/register" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Crear cuenta MICHITECH",
    description:
      "Empieza gratis: Envato Elements y Magnific con tutorial, historial y progreso en vivo.",
    url: "/register",
  },
}

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/go")

  return (
    <AuthShell
      headline="Únete y descarga más rápido."
      subline="Crea tu cuenta y empieza en minutos."
      formTitle="Crear cuenta"
      formSubtitle="Registro rápido. Sin pasos extra."
    >
      <RegisterForm />
    </AuthShell>
  )
}
