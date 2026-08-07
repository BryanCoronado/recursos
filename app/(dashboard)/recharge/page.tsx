import Image from "next/image"
import {
  Check,
  CheckCircle2,
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
  checkProviderDownloadAccess,
  expireDueMemberships,
  getActiveMembership,
} from "@/lib/billing/membership"
import { countDevicesForProvider } from "@/lib/billing/devices"
import { freeDownloadContextFromRequest } from "@/lib/billing/free-download-context"
import {
  FREE_DOWNLOAD_LIMIT,
  EXTRA_DEVICE_MONTHLY_SOLES,
  MONTHLY_PRICE_SOLES,
  SUBSCRIPTION_PLANS,
  WHATSAPP,
  planListSoles,
  planPerMonthSoles,
  planSavingsSoles,
  planTotalSoles,
  whatsappRechargeUrl,
  whatsappSupportUrl,
  type SubscriptionPlanKey,
} from "@/lib/billing/plans"
import {
  providerList,
} from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

const PLAN_KEYS = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanKey[]

export default async function RechargePage() {
  const access = await requirePagePermission(PERMISSIONS.RECHARGE_ACCESS)
  if (!access.allowed || !access.user) {
    return <AccessDenied moduleName="Recarga" />
  }

  await expireDueMemberships()
  const user = access.user
  const freeCtx = await freeDownloadContextFromRequest()

  const providerStates = await Promise.all(
    providerList().map(async (provider) => {
      const [membership, downloadAccess] = await Promise.all([
        getActiveMembership(user.id, provider.id),
        checkProviderDownloadAccess(user.id, provider.id, freeCtx),
      ])
      const deviceUsed = membership
        ? await countDevicesForProvider(user.id, provider.id)
        : 0
      return { provider, membership, downloadAccess, deviceUsed }
    })
  )

  const supportUrl = whatsappSupportUrl(user.name, user.email)
  const readyCount = providerStates.filter((s) => s.membership).length

  return (
    <div className="space-y-10">
      <section className="mich-page-card relative isolate px-6 py-10 sm:px-10">
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
              MICHITECH · Recarga
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-5xl">
              Recarga tu acceso
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-[var(--mich-muted)]">
              Planes para Envato y Magnific. 1 dispositivo incluido; +S/{" "}
              {EXTRA_DEVICE_MONTHLY_SOLES}/mes por cada extra. Elige proveedor y
              paquete, escribe por WhatsApp y lo activamos.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {providerList().map((p) => (
                <span
                  key={p.id}
                  className="flex size-10 items-center justify-center rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)]/80 p-1.5"
                >
                  <Image
                    src={p.logoSrc}
                    alt={p.shortLabel}
                    width={28}
                    height={28}
                    unoptimized
                    className="size-7 object-contain"
                  />
                </span>
              ))}
              <span className="ml-1 text-xs text-[var(--mich-muted)]">
                {readyCount}/{providerList().length} con membresía activa
              </span>
            </div>
          </div>

          <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {providerStates.map(
              ({ provider, membership, downloadAccess, deviceUsed }) => (
              <ProviderStatusCard
                key={provider.id}
                logoSrc={provider.logoSrc}
                label={provider.shortLabel}
                membership={membership}
                downloadAccess={downloadAccess}
                deviceUsed={deviceUsed}
              />
            )
            )}
          </div>
        </div>
      </section>

      {providerStates.map(({ provider }) => (
        <section key={provider.id}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-2 shadow-sm">
                <Image
                  src={provider.logoSrc}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="size-9 object-contain"
                />
              </span>
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
                  Planes {provider.shortLabel}
                </h2>
                <p className="mt-1 text-sm text-[var(--mich-muted)]">
                  Base S/ {MONTHLY_PRICE_SOLES}/mes · 1 dispositivo incluido ·
                  +S/ {EXTRA_DEVICE_MONTHLY_SOLES}/mes extra
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PLAN_KEYS.map((key) => {
              const plan = SUBSCRIPTION_PLANS[key]
              const total = planTotalSoles(key)
              const list = planListSoles(key)
              const save = planSavingsSoles(key)
              const perMonth = planPerMonthSoles(key)
              const url = whatsappRechargeUrl(user.name, user.email, {
                plan: key,
                provider: provider.id,
              })

              return (
                <article
                  key={`${provider.id}-${key}`}
                  className={cn(
                    "mich-soft-card relative flex flex-col overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1",
                    plan.highlight &&
                      "border-[var(--mich-blue)]/50 shadow-[0_24px_50px_-28px_var(--mich-glow)]"
                  )}
                >
                  {plan.highlight ? (
                    <span className="absolute right-4 top-4 rounded-full bg-[linear-gradient(135deg,var(--mich-blue),var(--mich-indigo))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Recomendado
                    </span>
                  ) : null}

                  <div className="mb-3 flex items-center gap-2">
                    <Image
                      src={provider.logoSrc}
                      alt=""
                      width={22}
                      height={22}
                      unoptimized
                      className="size-5 object-contain"
                    />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--mich-blue-bright)]">
                      {plan.tagline}
                    </p>
                  </div>
                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
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
                      Descargas {provider.shortLabel} ilimitadas
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[var(--mich-blue)]" />
                      1 dispositivo incluido
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="size-4 text-[var(--mich-blue)]" />
                      +S/ {EXTRA_DEVICE_MONTHLY_SOLES}/mes por dispositivo extra
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
                    Pedir plan {provider.shortLabel}
                  </a>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      <section className="grid gap-4 md:grid-cols-2">
        <a
          href={whatsappRechargeUrl(user.name, user.email)}
          target="_blank"
          rel="noreferrer"
          className="group mich-soft-card relative overflow-hidden bg-[linear-gradient(135deg,rgba(79,143,232,0.14),rgba(63,81,181,0.08))] p-6 transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="mb-4 size-8 text-[var(--mich-blue-bright)]" />
          <h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
            Solicitar recarga
          </h3>
          <p className="mt-2 text-sm text-[var(--mich-muted)]">
            Escríbenos a {WHATSAPP.display}. Indica proveedor + plan.
          </p>
        </a>
        <a
          href={supportUrl}
          target="_blank"
          rel="noreferrer"
          className="group mich-soft-card relative overflow-hidden p-6 transition-transform hover:-translate-y-0.5"
        >
          <Headphones className="mb-4 size-8 text-[var(--mich-indigo)]" />
          <h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
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

function ProviderStatusCard({
  logoSrc,
  label,
  membership,
  downloadAccess,
  deviceUsed,
}: {
  logoSrc: string
  label: string
  membership: Awaited<ReturnType<typeof getActiveMembership>>
  downloadAccess: Awaited<ReturnType<typeof checkProviderDownloadAccess>>
  deviceUsed: number
}) {
  return (
    <div className="mich-soft-card px-4 py-3 backdrop-blur">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--mich-text)]">
        <Image
          src={logoSrc}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="size-5 object-contain"
        />
        {label}
        <Sparkles className="ml-auto size-3.5 text-[var(--mich-blue-bright)]" />
      </div>
      {membership ? (
        <div className="space-y-1.5 text-sm">
          <span className="mich-chip mich-chip-ok">
            <CheckCircle2 className="size-3" />
            Activa
          </span>
          <p className="text-[var(--mich-muted)]">
            {SUBSCRIPTION_PLANS[membership.plan].label} · ilimitado
          </p>
          <p className="text-[var(--mich-muted)]">
            Dispositivos {deviceUsed}/{membership.maxDevices}
          </p>
          <p className="text-xs text-[var(--mich-muted)]">
            Hasta{" "}
            {membership.endsAt.toLocaleString("es", { dateStyle: "medium" })}
          </p>
        </div>
      ) : downloadAccess.allowed && !downloadAccess.unlimited ? (
        <div className="space-y-2 text-sm">
          <span className="mich-chip mich-chip-warn">Plan gratis</span>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--mich-surface)] ring-1 ring-[var(--mich-border)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--mich-blue),var(--mich-indigo))]"
              style={{
                width: `${(downloadAccess.used / FREE_DOWNLOAD_LIMIT) * 100}%`,
              }}
            />
          </div>
          <p className="text-[var(--mich-muted)]">
            {downloadAccess.remaining} de {FREE_DOWNLOAD_LIMIT} gratis
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 text-sm">
          <span className="mich-chip mich-chip-danger">Sin cupo</span>
          <p className="text-[var(--mich-muted)]">Activa un plan para seguir.</p>
        </div>
      )}
    </div>
  )
}
