import { LockKeyhole } from "lucide-react"

import { ChangePasswordForm } from "@/components/auth/change-password-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/authorization"

export default async function ChangePasswordPage() {
  await requireUser({ allowPasswordChange: true, allowIncompleteProfile: true })

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mich-surface-muted)] p-4">
      <Card className="w-full max-w-md border-[var(--mich-border)] bg-[var(--mich-surface)] shadow-none">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl border border-[var(--mich-border)] text-[var(--mich-muted)]">
            <LockKeyhole className="size-5" />
          </div>
          <CardTitle className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--mich-text)]">
            Cambia tu contraseña
          </CardTitle>
          <CardDescription className="text-[15px] leading-6 text-[var(--mich-muted)]">
            Debes establecer una contraseña personal antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  )
}
