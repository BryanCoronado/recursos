import type { Metadata } from "next"
import { JetBrains_Mono, Manrope, Outfit } from "next/font/google"
import { cookies } from "next/headers"

import { ThemeProvider } from "@/components/theme/theme-provider"

import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
})

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "MICHITECH",
    template: "%s | MICHITECH",
  },
  description: "Panel de recursos MICHITECH",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jar = await cookies()
  const themeCookie = jar.get("mich-theme")?.value
  const dark = themeCookie === "dark"

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${manrope.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full antialiased${dark ? " dark" : ""}`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
