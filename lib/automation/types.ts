import { z } from "zod"

export const automationStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("wait"),
    ms: z.number().int().positive().max(120_000),
  }),
  z.object({
    type: z.literal("click"),
    by: z.enum(["css", "xpath"]),
    selector: z.string().min(1),
    optional: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("waitFor"),
    by: z.enum(["css", "xpath"]),
    selector: z.string().min(1),
    timeoutMs: z.number().int().positive().max(120_000).optional(),
  }),
  z.object({
    type: z.literal("download"),
    by: z.enum(["css", "xpath"]),
    selector: z.string().min(1),
    /** Packs grandes de Envato pueden tardar varios minutos en empezar el archivo. */
    timeoutMs: z.number().int().positive().max(600_000).optional(),
  }),
])

export type AutomationStep = z.infer<typeof automationStepSchema>

export const automationStepsSchema = z.array(automationStepSchema).min(1)

/** Espera por defecto tras pulsar Descargar (preparación CDN + packs grandes). */
export const DEFAULT_DOWNLOAD_TIMEOUT_MS = 300_000

export const DEFAULT_ENVATO_STEPS: AutomationStep[] = [
  { type: "wait", ms: 1500 },
  {
    type: "click",
    by: "css",
    selector: 'button:has-text("Accept"), button:has-text("Aceptar")',
    optional: true,
  },
  {
    type: "waitFor",
    by: "css",
    selector:
      'button:has-text("Descargar"), button:has-text("Download"), a:has-text("Descargar"), a:has-text("Download")',
    timeoutMs: 60_000,
  },
  {
    type: "download",
    by: "css",
    selector:
      'button:has-text("Descargar"), button:has-text("Download"), a:has-text("Descargar"), a:has-text("Download")',
    timeoutMs: DEFAULT_DOWNLOAD_TIMEOUT_MS,
  },
]
