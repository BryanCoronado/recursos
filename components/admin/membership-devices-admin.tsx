"use client"

import { useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"

import {
  adminRevokeDeviceAction,
  updateMaxDevicesAction,
} from "@/app/(dashboard)/subscriptions/actions"
import { Button } from "@/components/ui/button"
import { MAX_DEVICES, MIN_DEVICES } from "@/lib/billing/plans"

type DeviceRow = {
  id: string
  label: string | null
  lastSeenAt: string
}

export function MembershipDevicesAdmin({
  membershipId,
  maxDevices,
  devices,
}: {
  membershipId: string
  maxDevices: number
  devices: DeviceRow[]
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)]/60 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--mich-muted)]">
          Dispositivos {devices.length}/{maxDevices}
        </p>
        <form
          action={(fd) => {
            startTransition(async () => {
              await updateMaxDevicesAction(fd)
            })
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="membershipId" value={membershipId} />
          <select
            name="maxDevices"
            defaultValue={maxDevices}
            className="h-8 rounded-lg border border-[var(--mich-border)] bg-[var(--mich-surface)] px-2 text-xs"
            disabled={pending}
          >
            {Array.from(
              { length: MAX_DEVICES - MIN_DEVICES + 1 },
              (_, i) => MIN_DEVICES + i
            ).map((n) => (
              <option key={n} value={n}>
                Cupo {n}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={pending}
            className="h-8 rounded-lg text-xs"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : "Guardar"}
          </Button>
        </form>
      </div>

      {devices.length === 0 ? (
        <p className="text-xs text-[var(--mich-muted)]">Sin dispositivos.</p>
      ) : (
        <ul className="space-y-2">
          {devices.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate text-[var(--mich-text)]">
                {d.label ?? "Dispositivo"}
                <span className="text-[var(--mich-muted)]">
                  {" "}
                  · {new Date(d.lastSeenAt).toLocaleString("es")}
                </span>
              </span>
              <form
                action={(fd) => {
                  startTransition(async () => {
                    await adminRevokeDeviceAction(fd)
                  })
                }}
              >
                <input type="hidden" name="deviceId" value={d.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  className="h-7 rounded-lg px-2 text-destructive"
                >
                  <Trash2 className="size-3" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
