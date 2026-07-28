import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { authOptions } from "@/lib/auth/config"

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <AuthShell
      headline="Únete y descarga más rápido."
      subline="Crea tu cuenta de cliente Envato y empieza en minutos."
      formTitle="Crear cuenta"
      formSubtitle="Registro para clientes Envato. Sin pasos extra."
    >
      <RegisterForm />
    </AuthShell>
  )
}
