import { getServerSession } from "next-auth/next"
import Image from "next/image"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/login-form"
import { authOptions } from "@/lib/auth/config"

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  const { callbackUrl: requestedCallback } = await searchParams
  const callbackUrl =
    requestedCallback?.startsWith("/") && !requestedCallback.startsWith("//")
      ? requestedCallback
      : "/dashboard"

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[var(--mich-surface-muted)] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(93,156,236,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(93,156,236,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="absolute left-[18%] top-[18%] -z-10 size-[26rem] rounded-full bg-[var(--mich-blue)]/20 blur-[110px]"
      />
      <div
        aria-hidden
        className="absolute bottom-[10%] right-[14%] -z-10 size-[22rem] rounded-full bg-[var(--mich-indigo)]/15 blur-[120px]"
      />

      <section className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
            <Image
              src="/michitech.png"
              alt="MICHITECH"
              width={220}
              height={220}
              priority
              className="h-auto w-[168px] sm:w-[196px]"
            />
          <p className="mt-6 max-w-sm text-[15px] leading-6 text-[var(--mich-muted)]">
            Inicia sesión en tu panel de recursos.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--mich-border)] bg-white p-6 shadow-[0_24px_60px_-36px_rgba(11,18,32,0.35)] sm:p-7">
         
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </section>
    </main>
  )
}
