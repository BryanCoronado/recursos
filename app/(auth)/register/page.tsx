import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { authOptions } from "@/lib/auth/config"

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Regístrate en MICHITECH y empieza a descargar recursos de Envato y Magnific.",
  robots: { index: true, follow: true },
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
