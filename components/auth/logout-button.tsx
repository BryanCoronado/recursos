"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label="Cerrar sesión"
    >
      <LogOut />
      <span className="hidden sm:inline">Salir</span>
    </Button>
  )
}
