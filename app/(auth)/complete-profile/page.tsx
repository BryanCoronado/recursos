import { Phone } from "lucide-react"

import { CompleteProfileForm } from "@/components/auth/complete-profile-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/authorization"
import { redirect } from "next/navigation"
import { resolveHomePath } from "@/lib/auth/home-path"

export default async function CompleteProfilePage() {
  const user = await requireUser({ allowIncompleteProfile: true })
  if (user.phone?.trim() && user.country?.trim()) {
    redirect(resolveHomePath(user.permissions))
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[var(--mich-surface-muted)] p-4">
      <div className="absolute left-1/2 top-1/2 -z-10 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--mich-blue)]/18 blur-[130px]" />
      <Card className="w-full max-w-md border-[var(--mich-border)] bg-[var(--mich-surface)] shadow-[0_24px_60px_-36px_rgba(11,18,32,0.3)]">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--mich-blue)] to-[var(--mich-indigo)] text-white shadow-[0_0_30px_-8px_var(--mich-glow)]">
            <Phone className="size-5" />
          </div>
          <CardTitle className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--mich-text)]">
            Completa tu celular
          </CardTitle>
          <CardDescription className="text-[15px] leading-6 text-[var(--mich-muted)]">
            Para seguir usando MICHITECH necesitamos tu país y número de
            WhatsApp. Solo toma un momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompleteProfileForm defaultCountry={user.country ?? "PE"} />
        </CardContent>
      </Card>
    </main>
  )
}
