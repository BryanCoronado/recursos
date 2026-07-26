import Image from "next/image"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

/**
 * Logo Michitech: en oscuro se invierte para verse claro (no se pierde
 * contra el fondo).
 */
export function BrandLogo({
  className,
  width = 160,
  height = 160,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo-mich-tech.png"
      alt="MICHITECH"
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "h-auto w-auto object-contain dark:invert",
        className
      )}
    />
  )
}
