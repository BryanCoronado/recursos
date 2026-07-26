"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Gem,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ScrollText,
  Shield,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ICONS = {
  dashboard: LayoutDashboard,
  envato: Gem,
  magnific: ImageIcon,
  sync: RefreshCw,
  automations: Workflow,
  users: Users,
  roles: Shield,
  audit: ScrollText,
} as const

const NAV_LOGOS: Partial<Record<keyof typeof ICONS, string>> = {
  envato: "/envato.png",
  magnific: "/magnific.png",
}

export type ShellIconName = keyof typeof ICONS

export type ShellNavItem = {
  href: string
  label: string
  icon: ShellIconName
}

type AppShellProps = {
  user: {
    name: string
    roleNames: string[]
  }
  navigation: ShellNavItem[]
  children: ReactNode
}

const STORAGE_KEY = "mich-sidebar-collapsed"

export function AppShell({ user, navigation, children }: AppShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "1") setCollapsed(true)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[var(--mich-surface-muted)] text-[var(--mich-text)]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--mich-border)] bg-white/95 shadow-[0_10px_40px_-24px_rgba(11,18,32,0.35)] backdrop-blur-xl transition-all duration-300 ease-out",
          "w-[272px] md:translate-x-0",
          collapsed ? "md:w-[88px]" : "md:w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-[var(--mich-border)] px-3",
            collapsed ? "md:justify-center" : "justify-between"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-xl px-1 py-1",
              collapsed && "md:justify-center"
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--mich-border)] bg-white shadow-[0_8px_24px_-12px_var(--mich-glow)]">
              <Image
                src="/michitech.png"
                alt="MICHITECH"
                width={40}
                height={40}
                className="size-9 object-contain"
              />
            </span>
            <span
              className={cn(
                "min-w-0 transition-all duration-300",
                collapsed
                  ? "md:w-0 md:overflow-hidden md:opacity-0"
                  : "opacity-100"
              )}
            >
              <span className="font-heading block truncate text-[15px] font-semibold tracking-[-0.03em] text-[var(--mich-text)]">
                MICHITECH
              </span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--mich-muted)]">
                Recursos
              </span>
            </span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-blue-bright)] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar sidebar"
          >
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p
            className={cn(
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--mich-muted)]/70 transition-all",
              collapsed && "md:hidden"
            )}
          >
            Navegación
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon: LucideIcon = ICONS[item.icon]
              const logoSrc = NAV_LOGOS[item.icon]
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    collapsed && "md:justify-center md:px-0",
                    active
                      ? "bg-[linear-gradient(135deg,rgba(93,156,236,0.18),rgba(63,81,181,0.12))] text-[var(--mich-text)] shadow-[inset_0_0_0_1px_rgba(93,156,236,0.35)]"
                      : "text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/8 hover:text-[var(--mich-text)]"
                  )}
                >
                  {logoSrc ? (
                    <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                      <Image
                        src={logoSrc}
                        alt={item.label}
                        width={20}
                        height={20}
                        className="size-5 object-contain"
                      />
                    </span>
                  ) : (
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-[var(--mich-blue-bright)]"
                          : "group-hover:text-[var(--mich-blue)]"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "truncate transition-all duration-300",
                      collapsed && "md:hidden"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-[var(--mich-border)] p-3">
          <div
            className={cn(
              "mb-3 rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] p-3",
              collapsed && "md:hidden"
            )}
          >
            <p className="truncate text-sm font-medium text-[var(--mich-text)]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[var(--mich-muted)]">
              {user.roleNames.join(", ") || "Sin rol"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "w-full justify-start text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-blue-bright)]",
              collapsed && "md:justify-center md:px-0"
            )}
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Cerrar sesión"
          >
            <LogOut />
            <span className={cn(collapsed && "md:hidden")}>Salir</span>
          </Button>
        </div>
      </aside>

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-out",
          collapsed ? "md:pl-[88px]" : "md:pl-[272px]"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-[var(--mich-border)] bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-blue-bright)] md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="hidden text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-blue-bright)] md:inline-flex"
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Expandir sidebar" : "Retraer sidebar"}
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </Button>
              <div>
                <p className="font-heading text-sm font-semibold tracking-[-0.02em] text-[var(--mich-text)]">
                  Panel de recursos
                </p>
                <p className="hidden text-xs text-[var(--mich-muted)] sm:block">
                  Sistema MICHITECH
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right text-xs sm:block">
                <p className="font-medium text-[var(--mich-text)]">{user.name}</p>
                <p className="text-[var(--mich-muted)]">
                  {user.roleNames.join(", ") || "Sin rol"}
                </p>
              </div>
              <span className="hidden size-2 rounded-full bg-[var(--mich-blue)] shadow-[0_0_12px_var(--mich-glow)] sm:inline-flex" />
            </div>
          </div>
        </header>

        <main className="min-w-0 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
