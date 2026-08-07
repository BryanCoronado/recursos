"use client"

import { Toaster as Sonner } from "sonner"

import { useTheme } from "@/components/theme/theme-provider"

export function Toaster() {
  const { resolved } = useTheme()

  return (
    <Sonner
      theme={resolved}
      position="top-right"
      closeButton
      richColors
      expand={false}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "mich-toast group border border-[var(--mich-border)]! bg-[var(--mich-surface)]! text-[var(--mich-text)]! shadow-[0_24px_50px_-28px_rgba(12,20,36,0.45)]",
          title: "font-heading text-sm font-semibold tracking-[-0.02em]",
          description: "text-[13px]! text-[var(--mich-muted)]!",
          actionButton:
            "bg-[var(--mich-blue)]! text-white! hover:bg-[var(--mich-blue-bright)]!",
          cancelButton:
            "bg-[var(--mich-surface-muted)]! text-[var(--mich-muted)]!",
          closeButton:
            "border-[var(--mich-border)]! bg-[var(--mich-surface)]! text-[var(--mich-muted)]!",
        },
      }}
    />
  )
}
