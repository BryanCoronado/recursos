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
    <main className="flex min-h-screen items-center justify-center bg-[var(--mich-surface-muted)] p-4">
      <Card className="w-full max-w-md border-[var(--mich-border)] bg-[var(--mich-surface)] shadow-none">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl border border-[var(--mich-border)] text-[var(--mich-muted)]">
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
