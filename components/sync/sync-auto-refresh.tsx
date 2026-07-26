"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** Refresca la página mientras haya alguna sesión SYNCING. */
export function SyncAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => {
      router.refresh()
    }, 2500)
    return () => window.clearInterval(timer)
  }, [active, router])

  return null
}
