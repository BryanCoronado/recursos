"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Gem,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  RefreshCw,
  ScrollText,
  Shield,
  Users,
  Wallet,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react"
import { signOut } from "next-auth/react"

import { BrandLogo } from "@/components/brand/brand-logo"
import {
  MembershipWelcomeBanner,
  type MembershipWelcomeItem,
} from "@/components/billing/membership-welcome"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ICONS = {
  dashboard: LayoutDashboard,
  envato: Gem,
  magnific: ImageIcon,
  sync: RefreshCw,
  automations: Workflow,
  subscriptions: CreditCard,
  recharge: Wallet,
  devices: MonitorSmartphone,
  downloads: Download,
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

export type ShellQuotaChip = {
  href: string
  label: string
  logoSrc?: string
  unlimited: boolean
  remaining?: number
  total?: number
}

type AppShellProps = {
  user: {
    name: string
    roleNames: string[]
  }
  navigation: ShellNavItem[]
  homeHref?: string
  quotaChips?: ShellQuotaChip[]
  membershipWelcome?: MembershipWelcomeItem[]
  children: ReactNode
}

const STORAGE_KEY = "mich-sidebar-collapsed"

function QuotaChipLink({ chip }: { chip: ShellQuotaChip }) {
  return (
    <Link
      href={chip.href}
      title={
        chip.unlimited
          ? `${chip.label}: ilimitado`
          : `${chip.label}: ${chip.remaining ?? 0} gratis`
      }
      className={cn(
        "mich-shell-quota inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        chip.unlimited
          ? "border-[color-mix(in_srgb,var(--mich-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-success)_12%,transparent)] text-[var(--mich-success)]"
          : (chip.remaining ?? 0) <= 0
            ? "border-[color-mix(in_srgb,var(--mich-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--mich-danger)_10%,transparent)] text-[var(--mich-danger)]"
            : "border-[var(--mich-border)] bg-[var(--mich-surface-muted)]/90 text-[var(--mich-muted)]"
      )}
    >
      {chip.logoSrc ? (
        <Image
          src={chip.logoSrc}
          alt=""
          width={14}
          height={14}
          unoptimized
          className="size-3.5 object-contain"
        />
      ) : null}
      <span className="hidden xs:inline sm:inline">{chip.label}</span>
      <span className="tabular-nums">
        {chip.unlimited ? "∞" : `${chip.remaining ?? 0}/${chip.total ?? 0}`}
      </span>
    </Link>
  )
}

export function AppShell({
  user,
  navigation,
  homeHref = "/dashboard",
  quotaChips = [],
  membershipWelcome = [],
  children,
}: AppShellProps) {
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

  const activeLabel =
    navigation.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.label ?? "Recursos"

  return (
    <div className="min-h-screen bg-[var(--mich-surface-muted)] text-[var(--mich-text)]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--mich-border)] bg-[var(--mich-surface)] transition-all duration-300 ease-out",
          "w-[272px] md:translate-x-0",
          collapsed ? "md:w-[88px]" : "md:w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div
          className={cn(
            "relative flex h-16 items-center border-b border-[var(--mich-border)] px-3",
            collapsed ? "md:justify-center" : "justify-between"
          )}
        >
          <Link
            href={homeHref}
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-xl px-1 py-1",
              collapsed && "md:justify-center"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <BrandLogo width={36} height={36} className="size-9" priority />
            </span>
            <span
              className={cn(
                "min-w-0 transition-all duration-300",
                collapsed
                  ? "md:w-0 md:overflow-hidden md:opacity-0"
                  : "opacity-100"
              )}
            >
              <span className="font-heading block truncate text-[16px] font-medium tracking-[-0.02em] text-[var(--mich-text)]">
                MICHITECH
              </span>
              <span className="block truncate text-[11px] text-[var(--mich-muted)]">
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

        <div className="relative flex-1 overflow-y-auto px-2.5 py-3">
          <nav className="space-y-0.5">
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
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                    collapsed && "md:justify-center md:px-0",
                    active
                      ? "bg-[var(--mich-surface-muted)] font-medium text-[var(--mich-text)] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:rounded-full before:bg-[var(--mich-blue)]"
                      : "text-[var(--mich-muted)] hover:bg-[var(--mich-surface-muted)]/70 hover:text-[var(--mich-text)]"
                  )}
                >
                  {logoSrc ? (
                    <span className="flex size-5 shrink-0 items-center justify-center">
                      <Image
                        src={logoSrc}
                        alt={item.label}
                        width={20}
                        height={20}
                        unoptimized
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

        <div className="relative border-t border-[var(--mich-border)] p-3">
          <div
            className={cn(
              "mb-2 px-2 py-1.5",
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
              "w-full justify-start rounded-xl text-[var(--mich-muted)] hover:bg-[var(--mich-blue)]/10 hover:text-[var(--mich-blue-bright)]",
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
        <header className="sticky top-0 z-30 border-b border-[var(--mich-border)] bg-[var(--mich-surface)]/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-2">
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
              <div className="min-w-0">
                <p className="font-heading truncate text-sm font-semibold tracking-[-0.02em] text-[var(--mich-text)]">
                  {activeLabel}
                </p>
                <p className="hidden text-xs text-[var(--mich-muted)] sm:block">
                  MICHITECH Recursos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {quotaChips.length > 0 ? (
                <div className="hidden items-center gap-1.5 lg:flex">
                  {quotaChips.map((chip) => (
                    <QuotaChipLink key={chip.href} chip={chip} />
                  ))}
                </div>
              ) : null}
              <ThemeToggle />
              <div className="hidden rounded-2xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)]/80 px-3 py-1.5 text-right text-xs sm:block">
                <p className="font-medium text-[var(--mich-text)]">{user.name}</p>
                <p className="text-[var(--mich-muted)]">
                  {user.roleNames[0] || "Sin rol"}
                </p>
              </div>
            </div>
          </div>
          {quotaChips.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto border-t border-[var(--mich-border)] px-4 py-2 lg:hidden">
              {quotaChips.map((chip) => (
                <QuotaChipLink key={chip.href} chip={chip} />
              ))}
            </div>
          ) : null}
        </header>

        <main className="mich-auth-rise min-w-0 p-4 md:p-8">
          {membershipWelcome.length > 0 ? (
            <MembershipWelcomeBanner items={membershipWelcome} />
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}
