import Image from "next/image"
import {
  Check,
  Headphones,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  ENVATO_FREE_DOWNLOAD_LIMIT,
  ENVATO_MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  WHATSAPP,
  planListSoles,
  planPerMonthSoles,
  planSavingsSoles,
  planTotalSoles,
  whatsappRechargeUrl,
  whatsappSupportUrl,
  type SubscriptionPlanKey,
} from "@/lib/billing/envato"
import {
  checkEnvatoDownloadAccess,
  expireDueMemberships,
  getActiveEnvatoMembership,
} from "@/lib/billing/membership"
import { cn } from "@/lib/utils"

const PLAN_KEYS = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanKey[]

export default async function RechargePage() {
  const access = await requirePagePermission(PERMISSIONS.RECHARGE_ACCESS)
  if (!access.allowed || !access.user) {
    return <AccessDenied moduleName="Recarga" />
  }

  await expireDueMemberships("ENVATO")
  const [membership, downloadAccess] = await Promise.all([
    getActiveEnvatoMembership(access.user.id),
    checkEnvatoDownloadAccess(access.user.id),
  ])

  const supportUrl = whatsappSupportUrl(access.user.name, access.user.email)

  return (
    <div className="space-y-10">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-[var(--mich-border)] bg-[var(--mich-surface)] px-6 py-10 shadow-[0_24px_60px_-40px_rgba(11,18,32,0.35)] sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 0%, rgba(93,156,236,0.22), transparent 55%), radial-gradient(ellipse at 90% 80%, rgba(63,81,181,0.14), transparent 50%)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
              MICHITECH · Envato
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-5xl">
              Recarga tu acceso
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-[var(--mich-muted)]">
              Descarga sin límites mientras tu plan esté activo. Elige un paquete,
              escríbenos por WhatsApp y lo activamos.
            </p>
          </div>

          <div className="min-w-[240px] rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)]/80 px-5 py-4 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--mich-text)]">
              <Sparkles className="size-4 text-[var(--mich-blue-bright)]" />
              Tu estado
            </div>
            {membership ? (
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-emerald-700">Membresía activa</p>
                <p className="text-[var(--mich-muted)]">
                  {SUBSCRIPTION_PLANS[membership.plan].label} · ilimitado
                </p>
                <p className="text-xs text-[var(--mich-muted)]">
                  Hasta{" "}
                  {membership.endsAt.toLocaleString("es", {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
            ) : downloadAccess.allowed && !downloadAccess.unlimited ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-amber-800">Plan gratis</p>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--mich-blue),var(--mich-indigo))]"
                    style={{
                      width: `${(downloadAccess.used / ENVATO_FREE_DOWNLOAD_LIMIT) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[var(--mich-muted)]">
                  {downloadAccess.remaining} de {ENVATO_FREE_DOWNLOAD_LIMIT}{" "}
                  gratis restantes
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-destructive">Sin cupo gratis</p>
                <p className="text-[var(--mich-muted)]">
                  Activa un plan para seguir descargando.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
              Planes Envato
            </h2>
            <p className="mt-1 text-sm text-[var(--mich-muted)]">
              Base S/ {ENVATO_MONTHLY_PRICE_SOLES}/mes. Packs con descuento.
            </p>
          </div>
          <Image
            src="/envato.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl object-contain opacity-90"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PLAN_KEYS.map((key) => {
            const plan = SUBSCRIPTION_PLANS[key]
            const total = planTotalSoles(key)
            const list = planListSoles(key)
            const save = planSavingsSoles(key)
            const perMonth = planPerMonthSoles(key)
            const url = whatsappRechargeUrl(
              access.user!.name,
              access.user!.email,
              key
            )

            return (
              <article
                key={key}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-[1.5rem] border bg-[var(--mich-surface)] p-6 transition-transform duration-300 hover:-translate-y-1",
                  plan.highlight
                    ? "border-[var(--mich-blue)]/50 shadow-[0_24px_50px_-28px_var(--mich-glow)]"
                    : "border-[var(--mich-border)] shadow-[0_16px_40px_-32px_rgba(11,18,32,0.3)]"
                )}
              >
                {plan.highlight ? (
                  <span className="absolute right-4 top-4 rounded-full bg-[linear-gradient(135deg,var(--mich-blue),var(--mich-indigo))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Recomendado
                  </span>
                ) : null}

                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--mich-blue-bright)]">
                  {plan.tagline}
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
                  {plan.label}
                </h3>

                <div className="mt-5 flex items-end gap-2">
                  <span className="font-heading text-4xl font-semibold tracking-[-0.04em] text-[var(--mich-text)]">
                    S/ {total}
                  </span>
                  {save > 0 ? (
                    <span className="pb-1 text-sm text-[var(--mich-muted)] line-through">
                      S/ {list}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[var(--mich-muted)]">
                  ≈ S/ {perMonth}/mes
                  {save > 0 ? ` · ahorras S/ ${save}` : ""}
                </p>

                <ul className="mt-6 space-y-2 text-sm text-[var(--mich-muted)]">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[var(--mich-blue)]" />
                    Descargas Envato ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="size-4 text-[var(--mich-blue)]" />
                    Activación por WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[var(--mich-blue)]" />
                    Vigencia de {plan.months}{" "}
                    {plan.months === 1 ? "mes" : "meses"}
                  </li>
                </ul>

                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({
                      variant: plan.highlight ? "default" : "outline",
                    }),
                    "mt-8 w-full justify-center rounded-xl"
                  )}
                >
                  <MessageCircle />
                  Pedir este plan
                </a>
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <a
          href={whatsappRechargeUrl(access.user.name, access.user.email)}
          target="_blank"
          rel="noreferrer"
          className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--mich-border)] bg-[linear-gradient(135deg,rgba(93,156,236,0.16),rgba(63,81,181,0.1))] p-6 transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="mb-4 size-8 text-[var(--mich-blue-bright)]" />
          <h3 className="font-heading text-xl font-semibold tracking-[-0.03em]">
            Solicitar recarga
          </h3>
          <p className="mt-2 text-sm text-[var(--mich-muted)]">
            Escríbenos a {WHATSAPP.display}. Indica el plan y te activamos.
          </p>
        </a>
        <a
          href={supportUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--mich-border)] bg-[var(--mich-surface)] p-6 transition-transform hover:-translate-y-0.5"
        >
          <Headphones className="mb-4 size-8 text-[var(--mich-indigo)]" />
          <h3 className="font-heading text-xl font-semibold tracking-[-0.03em]">
            Soporte
          </h3>
          <p className="mt-2 text-sm text-[var(--mich-muted)]">
            Problemas con descargas, sesión o tu cuenta. Te ayudamos por
            WhatsApp.
          </p>
        </a>
      </section>
    </div>
  )
}
