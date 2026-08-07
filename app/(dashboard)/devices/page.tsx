import Image from "next/image"
import Link from "next/link"
import { MonitorSmartphone, MessageCircle } from "lucide-react"

import { AccessDenied } from "@/components/auth/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { hasPermission, requireUser } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"
import { listUserDevices, countDevicesForProvider } from "@/lib/billing/devices"
import {
  EXTRA_DEVICE_MONTHLY_SOLES,
  whatsappExtraDeviceUrl,
  whatsappSupportUrl,
} from "@/lib/billing/plans"
import {
  getActiveMembership,
} from "@/lib/billing/membership"
import {
  providerList,
} from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

export default async function DevicesPage() {
  const user = await requireUser()
  const canSee =
    hasPermission(user.permissions, PERMISSIONS.RECHARGE_ACCESS) ||
    hasPermission(user.permissions, PERMISSIONS.ENVATO_ACCESS) ||
    hasPermission(user.permissions, PERMISSIONS.MAGNIFIC_ACCESS)

  if (!canSee) {
    return <AccessDenied moduleName="Dispositivos" />
  }

  const devices = await listUserDevices(user.id)
  const providers = providerList()
  const supportUrl = whatsappSupportUrl(user.name, user.email)

  const sections = await Promise.all(
    providers.map(async (provider) => {
      const membership = await getActiveMembership(user.id, provider.id)
      const providerDevices = devices.filter((d) => d.provider === provider.id)
      const used = await countDevicesForProvider(user.id, provider.id)
      return { provider, membership, devices: providerDevices, used }
    })
  )

  const hasAny =
    sections.some((s) => s.membership || s.devices.length > 0)

  return (
    <div className="space-y-8">
      <div className="mich-page-card relative px-6 py-7 sm:px-8">
        <div className="relative z-10">
          <p className="mb-2 font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mich-blue-bright)]">
            Cuenta
          </p>
          <h1 className="font-heading flex items-center gap-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--mich-text)] sm:text-4xl">
            <MonitorSmartphone className="size-8 text-[var(--mich-blue)]" />
            Mis dispositivos
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--mich-muted)]">
            Cada membresía incluye 1 dispositivo. Extra: +S/{" "}
            {EXTRA_DEVICE_MONTHLY_SOLES}/mes. No puedes quitar dispositivos tú
            mismo: si cambias de equipo, escríbenos por WhatsApp para liberar el
            cupo o ampliar el plan.
          </p>
          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-4 rounded-xl"
            )}
          >
            <MessageCircle className="size-3.5" />
            Solicitar cambio de dispositivo
          </a>
        </div>
      </div>

      {!hasAny ? (
        <div className="mich-soft-card px-6 py-12 text-center">
          <p className="text-[var(--mich-muted)]">
            Aún no tienes membresías ni dispositivos registrados.
          </p>
          <Link
            href="/recharge"
            className={cn(
              buttonVariants({ variant: "default" }),
              "mt-5 rounded-xl"
            )}
          >
            Ver planes
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {sections.map(({ provider, membership, devices: list, used }) => {
            if (!membership && list.length === 0) return null
            const max = membership?.maxDevices ?? 0
            const upgradeUrl = membership
              ? whatsappExtraDeviceUrl(
                  user.name,
                  user.email,
                  provider.id,
                  membership.maxDevices
                )
              : null
            const full = membership ? used >= max : false

            return (
              <section
                key={provider.id}
                className="mich-page-card relative p-6"
              >
                <div className="relative z-10 mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-2">
                      <Image
                        src={provider.logoSrc}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="size-8 object-contain"
                      />
                    </span>
                    <div>
                      <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
                        {provider.shortLabel}
                      </h2>
                      {membership ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "mich-chip",
                              full ? "mich-chip-warn" : "mich-chip-ok"
                            )}
                          >
                            {used}/{max} cupos
                          </span>
                          <p className="text-sm text-[var(--mich-muted)]">
                            hasta{" "}
                            {membership.endsAt.toLocaleString("es", {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--mich-muted)]">
                          Sin membresía activa (dispositivos históricos)
                        </p>
                      )}
                    </div>
                  </div>
                  {upgradeUrl ? (
                    <a
                      href={upgradeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-xl"
                      )}
                    >
                      <MessageCircle className="size-3.5" />
                      Pedir más dispositivos
                    </a>
                  ) : null}
                </div>

                {list.length === 0 ? (
                  <p className="relative z-10 text-sm text-[var(--mich-muted)]">
                    Ningún dispositivo registrado aún. Se registrará al usar{" "}
                    {provider.shortLabel} desde este navegador.
                  </p>
                ) : (
                  <ul className="relative z-10 divide-y divide-[var(--mich-border)]">
                    {list.map((device) => (
                      <li
                        key={device.id}
                        className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--mich-text)]">
                            {device.label ?? "Dispositivo"}
                          </p>
                          <p className="text-xs text-[var(--mich-muted)]">
                            Último uso{" "}
                            {device.lastSeenAt.toLocaleString("es")} · registrado{" "}
                            {device.createdAt.toLocaleString("es")}
                          </p>
                        </div>
                        <span className="mich-chip">Solo admin libera</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
