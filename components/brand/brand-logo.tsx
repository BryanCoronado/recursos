import Image from "next/image"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  width?: number
  height?: number
  priority?: boolean
  /**
   * auto  — oscuro en tema claro, claro en tema oscuro
   * light — siempre claro (fondos oscuros fijos)
   * dark  — siempre el asset original
   */
  tone?: "auto" | "light" | "dark"
}

/**
 * Logo Michitech sin fondo.
 * El asset es oscuro/contraste bajo en fondos negros: en tema oscuro se aclara.
 */
export function BrandLogo({
  className,
  width = 160,
  height = 160,
  priority = false,
  tone = "auto",
}: BrandLogoProps) {
  return (
    <Image
      src="/logo-sinfondo-michitech.png"
      alt="MICHITECH"
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "h-auto w-auto object-contain transition-[filter] duration-300",
        tone === "auto" && "dark:brightness-0 dark:invert",
        tone === "light" && "brightness-0 invert",
        className
      )}
    />
  )
}
