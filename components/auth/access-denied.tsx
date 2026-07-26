import Link from "next/link"
import { LockKeyhole, MessageCircle } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const ACCESS_REQUEST_WHATSAPP = {
  phone: "51917080235",
  display: "+51 917 080 235",
} as const

type AccessDeniedProps = {
  moduleName?: string
}

export function AccessDenied({ moduleName }: AccessDeniedProps) {
  const resource = moduleName ? ` al módulo ${moduleName}` : ""
  const message = encodeURIComponent(
    `Hola, soy usuario de MICHITECH y aún no tengo acceso${resource}. ¿Me puedes habilitar los permisos?`
  )
  const whatsappUrl = `https://wa.me/${ACCESS_REQUEST_WHATSAPP.phone}?text=${message}`

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--mich-blue)] to-[var(--mich-indigo)] text-white shadow-[0_12px_30px_-14px_var(--mich-glow)]">
        <LockKeyhole className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
          Aún no tienes acceso
        </h1>
        <p className="text-[15px] leading-7 text-[var(--mich-muted)]">
          {moduleName
            ? `Todavía no cuentas con permisos para usar ${moduleName}. Solicítalos por WhatsApp y te habilitamos el acceso.`
            : "Todavía no cuentas con permisos para esta sección. Solicítalos por WhatsApp y te habilitamos el acceso."}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-[#25D366] text-white hover:bg-[#1ebe57]"
          )}
        >
          <MessageCircle />
          Pedir acceso
        </a>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Volver al panel
        </Link>
      </div>
      <p className="text-xs text-[var(--mich-muted)]">
        WhatsApp: {ACCESS_REQUEST_WHATSAPP.display}
      </p>
    </div>
  )
}
