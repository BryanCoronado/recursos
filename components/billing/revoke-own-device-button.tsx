"use client"

import { useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { revokeOwnDeviceAction } from "@/app/(dashboard)/devices/actions"
import { Button } from "@/components/ui/button"

export function RevokeOwnDeviceButton({ deviceId }: { deviceId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await revokeOwnDeviceAction(fd)
        })
      }}
    >
      <input type="hidden" name="deviceId" value={deviceId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="rounded-xl"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        Quitar
      </Button>
    </form>
  )
}
