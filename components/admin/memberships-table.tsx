"use client"

import Image from "next/image"
import { Fragment, useMemo, useState, useTransition } from "react"
import { ChevronDown, Loader2, RefreshCw, Search, X } from "lucide-react"
import { toast } from "sonner"

import {
  cancelMembershipAction,
  renewMembershipAction,
} from "@/app/(dashboard)/subscriptions/actions"
import { MembershipDevicesAdmin } from "@/components/admin/membership-devices-admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SUBSCRIPTION_PLANS } from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

export type MembershipRow = {
  id: string
  provider: string
  providerLabel: string
  providerLogo: string
  plan: keyof typeof SUBSCRIPTION_PLANS
  status: "ACTIVE" | "CANCELLED" | "EXPIRED"
  totalPriceSoles: number
  maxDevices: number
  startsAt: string
  endsAt: string
  userName: string
  userEmail: string
  devices: { id: string; label: string | null; lastSeenAt: string }[]
}

const STATUS_LABEL = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
} as const

const STATUS_CHIP = {
  ACTIVE: "mich-chip mich-chip-ok",
  CANCELLED: "mich-chip mich-chip-danger",
  EXPIRED: "mich-chip",
} as const

type StatusFilter = "ALL" | MembershipRow["status"]

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function daysLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function MembershipsTable({
  memberships,
  providers,
}: {
  memberships: MembershipRow[]
  providers: { id: string; shortLabel: string }[]
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [provider, setProvider] = useState<string>("ALL")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function runRowAction(
    id: string,
    action: () => Promise<{ ok?: string; error?: string }>,
    successTitle: string
  ) {
    setBusyId(id)
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) {
          toast.error(successTitle, { description: result.error })
        } else {
          toast.success(successTitle, { description: result.ok })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  const counts = useMemo(() => {
    return {
      ALL: memberships.length,
      ACTIVE: memberships.filter((m) => m.status === "ACTIVE").length,
      EXPIRED: memberships.filter((m) => m.status === "EXPIRED").length,
      CANCELLED: memberships.filter((m) => m.status === "CANCELLED").length,
    }
  }, [memberships])

  const rows = useMemo(() => {
    const q = normalize(query.trim())
    return memberships.filter((m) => {
      if (status !== "ALL" && m.status !== status) return false
      if (provider !== "ALL" && m.provider !== provider) return false
      if (!q) return true
      return normalize(
        `${m.userName} ${m.userEmail} ${m.providerLabel}`
      ).includes(q)
    })
  }, [memberships, query, status, provider])

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "ALL", label: "Todas" },
    { key: "ACTIVE", label: "Activas" },
    { key: "EXPIRED", label: "Expiradas" },
    { key: "CANCELLED", label: "Canceladas" },
  ]

  return (
    <div className="mich-page-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--mich-border)] px-4 py-3.5 sm:px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--mich-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, correo o proveedor…"
            className="h-11 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] pl-9 pr-9 text-sm outline-none transition-colors focus:border-[var(--mich-blue)]/55 focus:bg-[var(--mich-surface)] placeholder:text-[var(--mich-muted)]/70"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mich-muted)] hover:text-[var(--mich-text)]"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatus(filter.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                status === filter.key
                  ? "border-[var(--mich-blue)]/55 bg-[var(--mich-blue)]/10 text-[var(--mich-blue-bright)]"
                  : "border-[var(--mich-border)] text-[var(--mich-muted)] hover:border-[var(--mich-blue)]/35"
              )}
            >
              {filter.label}
              <span className="ml-1 tabular-nums opacity-70">
                {counts[filter.key]}
              </span>
            </button>
          ))}

          <span className="mx-1 hidden h-4 w-px bg-[var(--mich-border)] sm:block" />

          <button
            type="button"
            onClick={() => setProvider("ALL")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              provider === "ALL"
                ? "border-[var(--mich-blue)]/55 bg-[var(--mich-blue)]/10 text-[var(--mich-blue-bright)]"
                : "border-[var(--mich-border)] text-[var(--mich-muted)] hover:border-[var(--mich-blue)]/35"
            )}
          >
            Todos
          </button>
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                provider === p.id
                  ? "border-[var(--mich-blue)]/55 bg-[var(--mich-blue)]/10 text-[var(--mich-blue-bright)]"
                  : "border-[var(--mich-border)] text-[var(--mich-muted)] hover:border-[var(--mich-blue)]/35"
              )}
            >
              {p.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-14 text-center text-sm text-[var(--mich-muted)]">
          {memberships.length === 0
            ? "Aún no hay membresías registradas."
            : "Ningún resultado con esos filtros."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 sm:px-5">Cliente</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Disp.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="px-4 text-right sm:px-5">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => {
              const active = item.status === "ACTIVE"
              const left = daysLeft(item.endsAt)
              const isOpen = expanded === item.id
              return (
                <Fragment key={item.id}>
                  <TableRow>
                    <TableCell className="px-4 sm:px-5">
                      <p className="font-medium text-[var(--mich-text)]">
                        {item.userName}
                      </p>
                      <p className="text-xs text-[var(--mich-muted)]">
                        {item.userEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Image
                          src={item.providerLogo}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                          className="size-5 object-contain"
                        />
                        <span className="text-[var(--mich-text)]">
                          {item.providerLabel}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-[var(--mich-text)]">
                        {SUBSCRIPTION_PLANS[item.plan].label}
                      </p>
                      <p className="text-xs text-[var(--mich-muted)]">
                        S/ {item.totalPriceSoles}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-[var(--mich-text)]">
                        {formatDate(item.startsAt)}
                        <span className="text-[var(--mich-muted)]"> → </span>
                        {formatDate(item.endsAt)}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          active && left <= 7
                            ? "text-[var(--mich-warning)]"
                            : "text-[var(--mich-muted)]"
                        )}
                      >
                        {active
                          ? left > 0
                            ? `${left} día${left === 1 ? "" : "s"} restantes`
                            : "vence hoy"
                          : STATUS_LABEL[item.status].toLowerCase()}
                      </p>
                    </TableCell>
                    <TableCell className="tabular-nums text-[var(--mich-muted)]">
                      {item.devices.length}/{item.maxDevices}
                    </TableCell>
                    <TableCell>
                      <span className={STATUS_CHIP[item.status]}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-right sm:px-5">
                      <span className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyId === item.id}
                          title={`Renovar ${SUBSCRIPTION_PLANS[item.plan].label}${
                            active
                              ? " desde la fecha de vencimiento"
                              : " a partir de hoy"
                          }`}
                          onClick={() =>
                            runRowAction(
                              item.id,
                              () => renewMembershipAction(item.id),
                              "Renovar membresía"
                            )
                          }
                          className="rounded-lg"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <RefreshCw />
                          )}
                          Renovar
                        </Button>

                        {active ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setExpanded(isOpen ? null : item.id)
                            }
                            className="rounded-lg"
                          >
                            Dispositivos
                            <ChevronDown
                              className={cn(
                                "transition-transform",
                                isOpen && "rotate-180"
                              )}
                            />
                          </Button>
                        ) : null}

                        {active ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={busyId === item.id}
                            onClick={() =>
                              runRowAction(
                                item.id,
                                () => cancelMembershipAction(item.id),
                                "Cancelar membresía"
                              )
                            }
                            className="rounded-lg"
                          >
                            Cancelar
                          </Button>
                        ) : null}
                      </span>
                    </TableCell>
                  </TableRow>
                  {isOpen ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-4 pb-4 sm:px-5">
                        <MembershipDevicesAdmin
                          membershipId={item.id}
                          maxDevices={item.maxDevices}
                          devices={item.devices}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      )}

      <div className="border-t border-[var(--mich-border)] px-4 py-3 text-xs text-[var(--mich-muted)] sm:px-5">
        Mostrando {rows.length} de {memberships.length} membresías
      </div>
    </div>
  )
}
