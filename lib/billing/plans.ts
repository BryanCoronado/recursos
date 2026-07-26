/**
 * Planes y precios compartidos (Envato + Magnific).
 * Ajustar aquí si un proveedor tiene tarifa distinta.
 */
import { ACCESS_REQUEST_WHATSAPP } from "@/components/auth/access-denied"
import {
  getProvider,
  type ResourceProviderId,
} from "@/lib/providers/catalog"

export const MONTHLY_PRICE_SOLES = 20
export const FREE_DOWNLOAD_LIMIT = 2

/** @deprecated usar MONTHLY_PRICE_SOLES */
export const ENVATO_MONTHLY_PRICE_SOLES = MONTHLY_PRICE_SOLES
/** @deprecated usar FREE_DOWNLOAD_LIMIT */
export const ENVATO_FREE_DOWNLOAD_LIMIT = FREE_DOWNLOAD_LIMIT

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    months: 1,
    label: "1 mes",
    tagline: "Flexible",
    totalSoles: 20,
    highlight: false,
  },
  QUARTERLY: {
    months: 3,
    label: "3 meses",
    tagline: "Más elegido",
    totalSoles: 54,
    highlight: true,
  },
  YEARLY: {
    months: 12,
    label: "1 año",
    tagline: "Mejor precio",
    totalSoles: 180,
    highlight: false,
  },
} as const

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS

export function planListSoles(plan: SubscriptionPlanKey) {
  return MONTHLY_PRICE_SOLES * SUBSCRIPTION_PLANS[plan].months
}

export function planTotalSoles(plan: SubscriptionPlanKey) {
  return SUBSCRIPTION_PLANS[plan].totalSoles
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
  }
) {
  const provider = options?.provider
  const providerLabel = provider
    ? getProvider(provider).shortLabel
    : "Envato / Magnific"
  const planLine = options?.plan
    ? ` Quiero el plan ${SUBSCRIPTION_PLANS[options.plan].label} de ${providerLabel} por S/ ${planTotalSoles(options.plan)}.`
    : ` Quiero activar una membresía ${providerLabel} (desde S/ ${MONTHLY_PRICE_SOLES}/mes).`

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
