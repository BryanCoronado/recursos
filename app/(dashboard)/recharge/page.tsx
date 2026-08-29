import Image from "next/image"
import {
  Check,
  Headphones,
  MessageCircle,
  Zap,
} from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { QuotaMeter } from "@/components/billing/quota-meter"
import { buttonVariants } from "@/components/ui/button"
import { hasPermission, requirePagePermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  checkProviderDownloadAccess,
  expireDueMemberships,
  getActiveMembership,
} from "@/lib/billing/membership"
import { countDevicesForProvider } from "@/lib/billing/devices"
import { freeDownloadContextFromRequest } from "@/lib/billing/free-download-context"
import {
  EXTRA_DEVICE_MONTHLY_SOLES,
  EXTRA_DEVICE_MONTHLY_USD,
  MONTHLY_PRICE_SOLES,
  MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLANS,
  WHATSAPP,
  planListSoles,
  planPerMonthSoles,
  planPerMonthUsd,
  planSavingsSoles,
  planTotalSoles,
  planTotalUsd,
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

  const providerStates = (
    await Promise.all(
      providerList().map(async (provider) => {
        const canAccess =
          provider.id === "ENVATO"
            ? hasPermission(user.permissions, PERMISSIONS.ENVATO_ACCESS)
            : hasPermission(user.permissions, PERMISSIONS.MAGNIFIC_ACCESS)
        if (!canAccess) return null

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
  ).filter((s): s is NonNullable<typeof s> => s !== null)

  const supportUrl = whatsappSupportUrl(user.name, user.email)
  const readyCount = providerStates.filter((s) => s.membership).length

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-heading text-3xl font-medium tracking-[-0.03em] text-[var(--mich-text)] sm:text-4xl">
          Recarga
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-7 text-[var(--mich-muted)]">
          Planes según tus proveedores
          {providerStates.length === 1
            ? ` (${providerStates[0].provider.shortLabel})`
            : ""}
          . 1 dispositivo incluido. Extra +S/ {EXTRA_DEVICE_MONTHLY_SOLES} / $
          {EXTRA_DEVICE_MONTHLY_USD} USD. Activación por WhatsApp.
        </p>
        <div className="mt-4 flex items-center gap-2">
          {providerStates.map(({ provider: p }) => (
            <span
              key={p.id}
              className="flex size-9 items-center justify-center rounded-lg border border-[var(--mich-border)] p-1.5"
            >
              <Image
                src={p.logoSrc}
                alt={p.shortLabel}
                width={24}
                height={24}
                unoptimized
                className="size-6 object-contain"
              />
            </span>
          ))}
          <span className="ml-1 text-xs text-[var(--mich-muted)]">
            {readyCount}/{Math.max(providerStates.length, 1)} con membresía
            activa
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                  Base S/ {MONTHLY_PRICE_SOLES} / ${MONTHLY_PRICE_USD} USD · mes
                  · 1 dispositivo incluido · +S/ {EXTRA_DEVICE_MONTHLY_SOLES} / $
                  {EXTRA_DEVICE_MONTHLY_USD} USD extra
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
                    "mich-soft-card mich-hover-card relative flex flex-col p-5 sm:p-6",
                    plan.highlight && "border-[var(--mich-blue)]/45"
                  )}
                >
                  {plan.highlight ? (
                    <span className="absolute right-4 top-4 rounded-full bg-[var(--mich-blue)] px-2.5 py-0.5 text-[11px] font-medium text-white">
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
                    <p className="text-[12px] text-[var(--mich-muted)]">
                      {plan.tagline}
                    </p>
                  </div>
                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
                    {plan.label}
                  </h3>

                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-heading text-4xl font-semibold tracking-[-0.04em]">
                      S/ {total}
                    </span>
                    {save > 0 ? (
                      <span className="pb-1 text-sm text-[var(--mich-muted)] line-through">
                        S/ {list}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-heading text-lg font-semibold text-[var(--mich-blue-bright)]">
                    ${planTotalUsd(key)} USD
                  </p>
                  <p className="mt-1 text-sm text-[var(--mich-muted)]">
                    ≈ S/ {perMonth}/mes · ${planPerMonthUsd(key)} USD/mes
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
                      +S/ {EXTRA_DEVICE_MONTHLY_SOLES} / $
                      {EXTRA_DEVICE_MONTHLY_USD} USD por dispositivo extra
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
                      "mt-8 w-full justify-center rounded-2xl transition-transform hover:-translate-y-0.5"
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
          className="mich-soft-card p-5 sm:p-6"
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
          className="mich-soft-card p-5 sm:p-6"
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
    <div className="mich-soft-card px-4 py-3">
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
      </div>
      {membership ? (
        <div className="space-y-2 text-sm">
          <QuotaMeter
            mode="unlimited"
            endsAt={membership.endsAt.toISOString()}
          />
          <p className="text-[var(--mich-muted)]">
            {SUBSCRIPTION_PLANS[membership.plan].label} · dispositivos{" "}
            {deviceUsed}/{membership.maxDevices}
          </p>
        </div>
      ) : downloadAccess.allowed && !downloadAccess.unlimited ? (
        <QuotaMeter
          mode="free"
          used={downloadAccess.used}
          remaining={downloadAccess.remaining}
        />
      ) : (
        <QuotaMeter
          mode="empty"
          reason="Activa un plan para seguir descargando."
        />
      )}
    </div>
  )
}
