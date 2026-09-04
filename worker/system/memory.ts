import fs from "node:fs"
import os from "node:os"

/**
 * RAM disponible en MB.
 *
 * En Linux leemos `MemAvailable` de /proc/meminfo: `os.freemem()` devuelve
 * `MemFree`, que en un VPS con caché de disco caliente se ve casi en cero
 * aunque el kernel pueda liberar memoria de sobra.
 */
export function availableMemoryMb(): number {
  if (process.platform === "linux") {
    try {
      const meminfo = fs.readFileSync("/proc/meminfo", "utf8")
      const match = meminfo.match(/^MemAvailable:\s+(\d+)\s*kB$/m)
      if (match) return Math.round(Number(match[1]) / 1024)
    } catch {
      // sin /proc: usamos el fallback
    }
  }
  return Math.round(os.freemem() / (1024 * 1024))
}
