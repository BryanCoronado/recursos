/** Extrae el ID de un enlace de YouTube (watch, youtu.be, embed). */
export function youtubeEmbedId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").split("/")[0] || null
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v")
    }
    const embed = parsed.pathname.match(/\/embed\/([^/?]+)/)
    return embed?.[1] ?? null
  } catch {
    return null
  }
}
