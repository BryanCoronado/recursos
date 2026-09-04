/**
 * Planes y precios compartidos (Envato + Magnific).
 * Ajustar aquí si un proveedor tiene tarifa distinta.
 */
import { ACCESS_REQUEST_WHATSAPP } from "@/components/auth/access-denied"
import {
  getProvider,
  type ResourceProviderId,
} from "@/lib/providers/catalog"

export const MONTHLY_PRICE_SOLES = 15
/** Precio público en USD (equivalente redondeado de S/ 15). */
export const MONTHLY_PRICE_USD = 5
export const FREE_DOWNLOAD_LIMIT = 2
/**
 * Tope suave por IP en plan gratis (misma red / móvil).
 * Evita crear muchas cuentas desde la misma conexión.
 */
export const FREE_DOWNLOAD_PER_IP_LIMIT = 4
/** Precio mensual por cada dispositivo adicional (el 1.º va incluido). */
export const EXTRA_DEVICE_MONTHLY_SOLES = 10
export const EXTRA_DEVICE_MONTHLY_USD = 3
export const MIN_DEVICES = 1
export const MAX_DEVICES = 10

/** @deprecated usar MONTHLY_PRICE_SOLES */
export const ENVATO_MONTHLY_PRICE_SOLES = MONTHLY_PRICE_SOLES
/** @deprecated usar FREE_DOWNLOAD_LIMIT */
export const ENVATO_FREE_DOWNLOAD_LIMIT = FREE_DOWNLOAD_LIMIT

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    months: 1,
    label: "1 mes",
    tagline: "Flexible",
    totalSoles: 15,
    totalUsd: 5,
    highlight: false,
  },
  QUARTERLY: {
    months: 3,
    label: "3 meses",
    tagline: "Más elegido",
    totalSoles: 40,
    totalUsd: 12,
    highlight: true,
  },
  YEARLY: {
    months: 12,
    label: "1 año",
    tagline: "Mejor precio",
    totalSoles: 135,
    totalUsd: 40,
    highlight: false,
  },
} as const

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS

export function clampDevices(n: number) {
  return Math.min(MAX_DEVICES, Math.max(MIN_DEVICES, Math.floor(n)))
}

export function planListSoles(plan: SubscriptionPlanKey) {
  return MONTHLY_PRICE_SOLES * SUBSCRIPTION_PLANS[plan].months
}

export function planTotalSoles(plan: SubscriptionPlanKey) {
  return SUBSCRIPTION_PLANS[plan].totalSoles
}

export function planTotalUsd(plan: SubscriptionPlanKey) {
  return SUBSCRIPTION_PLANS[plan].totalUsd
}

export function planPerMonthUsd(plan: SubscriptionPlanKey) {
  const p = SUBSCRIPTION_PLANS[plan]
  return Math.round((p.totalUsd / p.months) * 10) / 10
}

export function extraDevicesUsd(maxDevices: number, months: number) {
  const extras = Math.max(0, clampDevices(maxDevices) - 1)
  return extras * EXTRA_DEVICE_MONTHLY_USD * months
}

export function membershipTotalUsd(
  plan: SubscriptionPlanKey,
  maxDevices: number = 1
) {
  return planTotalUsd(plan) + extraDevicesUsd(maxDevices, SUBSCRIPTION_PLANS[plan].months)
}

export function formatPenUsd(soles: number, usd: number) {
  return `S/ ${soles} · $${usd} USD`
}

/** Extra por dispositivos adicionales (sin descuento de pack). */
export function extraDevicesSoles(maxDevices: number, months: number) {
  const extras = Math.max(0, clampDevices(maxDevices) - 1)
  return extras * EXTRA_DEVICE_MONTHLY_SOLES * months
}

/** Total plan + dispositivos. */
export function membershipTotalSoles(
  plan: SubscriptionPlanKey,
  maxDevices: number = 1
) {
  const base = planTotalSoles(plan)
  const months = SUBSCRIPTION_PLANS[plan].months
  return base + extraDevicesSoles(maxDevices, months)
}

export function planSavingsSoles(plan: SubscriptionPlanKey) {
  return Math.max(0, planListSoles(plan) - planTotalSoles(plan))
}

export function planPerMonthSoles(plan: SubscriptionPlanKey) {
  const p = SUBSCRIPTION_PLANS[plan]
  return Math.round((p.totalSoles / p.months) * 10) / 10
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export const WHATSAPP = ACCESS_REQUEST_WHATSAPP

export function whatsappRechargeUrl(
  userName: string,
  userEmail: string,
  options?: {
    plan?: SubscriptionPlanKey
    provider?: ResourceProviderId
    maxDevices?: number
  }
) {
  const provider = options?.provider
  const providerLabel = provider
    ? getProvider(provider).shortLabel
    : "Envato / Magnific"
  const devices = clampDevices(options?.maxDevices ?? 1)
  const devicesLine =
    devices > 1
      ? ` con ${devices} dispositivos (+S/ ${EXTRA_DEVICE_MONTHLY_SOLES}/mes c/u extra)`
      : " (1 dispositivo incluido)"

  const planLine = options?.plan
    ? ` Quiero el plan ${SUBSCRIPTION_PLANS[options.plan].label} de ${providerLabel} por S/ ${membershipTotalSoles(options.plan, devices)}${devicesLine}.`
    : ` Quiero activar una membresía ${providerLabel} (desde S/ ${MONTHLY_PRICE_SOLES}/mes, 1 dispositivo; +S/ ${EXTRA_DEVICE_MONTHLY_SOLES}/mes por dispositivo extra).`

  const text = encodeURIComponent(
    `Hola, soy ${userName} (${userEmail}).${planLine} MICHITECH Recursos.`
  )
  return `https://wa.me/${WHATSAPP.phone}?text=${text}`
}

export function whatsappSupportUrl(userName: string, userEmail: string) {
  const text = encodeURIComponent(
    `Hola, soy ${userName} (${userEmail}). Necesito soporte con MICHITECH Recursos.`
  )
  return `https://wa.me/${WHATSAPP.phone}?text=${text}`
}

export function whatsappExtraDeviceUrl(
  userName: string,
  userEmail: string,
  provider: ResourceProviderId,
  currentMax: number
) {
  const label = getProvider(provider).shortLabel
  const next = currentMax + 1
  const text = encodeURIComponent(
    `Hola, soy ${userName} (${userEmail}). Quiero ampliar mi membresía ${label} a ${next} dispositivos (+S/ ${EXTRA_DEVICE_MONTHLY_SOLES}/mes por dispositivo extra). MICHITECH Recursos.`
  )
  return `https://wa.me/${WHATSAPP.phone}?text=${text}`
}

/** Normaliza celular PE a wa.me (519…) */
export function normalizeWhatsAppPhone(phone: string | null | undefined) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  if (digits.startsWith("51") && digits.length >= 11) return digits
  if (digits.length === 9) return `51${digits}`
  if (digits.length >= 10) return digits
  return null
}

/** Aviso al cliente: tu membresía ya está activa. */
export function whatsappMembershipReadyUrl(options: {
  phone: string
  userName: string
  provider: ResourceProviderId
  plan: SubscriptionPlanKey
  endsAt: Date
}) {
  const phone = normalizeWhatsAppPhone(options.phone)
  if (!phone) return null
  const label = getProvider(options.provider).shortLabel
  const planLabel = SUBSCRIPTION_PLANS[options.plan].label
  const ends = options.endsAt.toLocaleDateString("es")
  const text = encodeURIComponent(
    `Hola ${options.userName} 👋\n\nTu membresía *${label}* (${planLabel}) en MICHITECH ya está *activa* hasta el ${ends}.\n\nEntra a https://michitech.digital e inicia sesión para descargar.\n\n¡Listo para usar!`
  )
  return `https://wa.me/${phone}?text=${text}`
}
