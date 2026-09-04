"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

export type PickerUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  /** Proveedores con membresía activa, para avisar al admin */
  activeProviders?: string[]
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function UserPicker({
  users,
  name = "userId",
  value,
  onChange,
  disabled,
}: {
  users: PickerUser[]
  name?: string
  value: string
  onChange: (userId: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const boxRef = useRef<HTMLDivElement>(null)

  const selected = users.find((u) => u.id === value) ?? null

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return users.slice(0, 40)
    return users
      .filter((u) => {
        const haystack = normalize(
          `${u.name} ${u.email} ${u.phone ?? ""}`
        )
        return haystack.includes(q)
      })
      .slice(0, 40)
  }, [users, query])

  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={boxRef} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm transition-colors",
          open
            ? "border-[var(--mich-blue)]/55 bg-[var(--mich-surface)]"
            : "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] hover:border-[var(--mich-blue)]/35",
          disabled && "opacity-60"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selected ? (
          <span className="min-w-0 truncate">
            <span className="font-medium text-[var(--mich-text)]">
              {selected.name}
            </span>
            <span className="text-[var(--mich-muted)]">
              {" · "}
              {selected.email}
            </span>
          </span>
        ) : (
          <span className="text-[var(--mich-muted)]">
            Buscar cliente por nombre, correo o celular…
          </span>
        )}
        <span className="flex shrink-0 items-center gap-1">
          {selected ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Quitar cliente"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
                setQuery("")
              }}
              className="rounded-md p-0.5 text-[var(--mich-muted)] hover:text-[var(--mich-text)]"
            >
              <X className="size-3.5" />
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "size-4 text-[var(--mich-muted)] transition-transform",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface)] shadow-[var(--mich-shadow-page)]">
          <div className="flex items-center gap-2 border-b border-[var(--mich-border)] px-3 py-2.5">
            <Search className="size-4 shrink-0 text-[var(--mich-muted)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, correo o celular"
              className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-[var(--mich-muted)]/70"
            />
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--mich-muted)]">
                Sin resultados para “{query}”.
              </li>
            ) : (
              results.map((user) => {
                const isSelected = user.id === value
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(user.id)
                        setOpen(false)
                        setQuery("")
                      }}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-[var(--mich-blue)]/10"
                          : "hover:bg-[var(--mich-surface-muted)]"
                      )}
                    >
                      <span className="mt-0.5 size-4 shrink-0">
                        {isSelected ? (
                          <Check className="size-4 text-[var(--mich-blue)]" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--mich-text)]">
                          {user.name}
                        </span>
                        <span className="block truncate text-xs text-[var(--mich-muted)]">
                          {user.email}
                          {user.phone ? ` · ${user.phone}` : " · sin celular"}
                        </span>
                      </span>
                      {user.activeProviders?.length ? (
                        <span className="mich-chip mich-chip-ok shrink-0 text-[10px]">
                          {user.activeProviders.join(" · ")}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          <p className="border-t border-[var(--mich-border)] px-3 py-2 text-[11px] text-[var(--mich-muted)]">
            {users.length} clientes activos
            {results.length < users.length
              ? ` · mostrando ${results.length}`
              : ""}
          </p>
        </div>
      ) : null}
    </div>
  )
}
