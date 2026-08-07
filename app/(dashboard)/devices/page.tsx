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
      <div className="relative overflow-hidden rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] px-6 py-7 shadow-[0_20px_50px_-36px_rgba(11,18,32,0.4)] sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-44 rounded-full bg-[var(--mich-blue)]/15 blur-3xl"
        />
        <div className="relative">
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
        <div className="rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] px-6 py-12 text-center">
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

            return (
              <section
                key={provider.id}
                className="rounded-3xl border border-[var(--mich-border)] bg-[var(--mich-surface)] p-6 shadow-[0_16px_40px_-32px_rgba(11,18,32,0.3)]"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
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
                        <p className="text-sm text-[var(--mich-muted)]">
                          Cupos {used}/{max} · vigente hasta{" "}
                          {membership.endsAt.toLocaleString("es", {
                            dateStyle: "medium",
                          })}
                        </p>
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
                  <p className="text-sm text-[var(--mich-muted)]">
                    Ningún dispositivo registrado aún. Se registrará al usar{" "}
                    {provider.shortLabel} desde este navegador.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--mich-border)]">
                    {list.map((device) => (
                      <li
                        key={device.id}
                        className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
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
                        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--mich-muted)]">
                          Solo admin puede liberar
                        </span>
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
