"use client"

import Image from "next/image"

import {
  PROVIDERS,
  RESOURCE_PROVIDERS,
  type ResourceProviderId,
} from "@/lib/providers/catalog"
import { cn } from "@/lib/utils"

type ProviderSelectProps = {
  name?: string
  defaultValue?: ResourceProviderId
  value?: ResourceProviderId
  onChange?: (value: ResourceProviderId) => void
  disabled?: boolean
  className?: string
  /** Si true, renderiza radios en vez de select */
  variant?: "select" | "cards"
}

export function ProviderSelect({
  name = "provider",
  defaultValue = "ENVATO",
  value,
  onChange,
  disabled,
  className,
  variant = "cards",
}: ProviderSelectProps) {
  if (variant === "select") {
    return (
      <select
        name={name}
        defaultValue={value ?? defaultValue}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value as ResourceProviderId)}
        className={cn(
          "h-10 w-full rounded-xl border border-[var(--mich-border)] bg-[var(--mich-surface-muted)] px-3 text-sm",
          className
        )}
      >
        {RESOURCE_PROVIDERS.map((id) => (
          <option key={id} value={id}>
            {PROVIDERS[id].label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <fieldset className={cn("space-y-2", className)} disabled={disabled}>
      <legend className="mb-1 text-sm font-medium">Proveedor</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {RESOURCE_PROVIDERS.map((id) => {
          const provider = PROVIDERS[id]
          const selected = (value ?? defaultValue) === id
          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-colors",
                selected
                  ? "border-[var(--mich-blue)]/55 bg-[var(--mich-blue)]/8"
                  : "border-[var(--mich-border)] bg-[var(--mich-surface-muted)] hover:border-[var(--mich-blue)]/35"
              )}
            >
              <input
                type="radio"
                name={name}
                value={id}
                {...(value !== undefined
                  ? {
                      checked: selected,
                      onChange: () => onChange?.(id),
                    }
                  : {
                      defaultChecked: id === defaultValue,
                    })}
                className="sr-only"
              />
              <Image
                src={provider.logoSrc}
                alt=""
                width={28}
                height={28}
                unoptimized
                className="size-7 object-contain"
              />
              <span className="font-medium text-[var(--mich-text)]">
                {provider.shortLabel}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
