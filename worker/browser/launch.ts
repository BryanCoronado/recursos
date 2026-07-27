import { chromium, type LaunchOptions } from "playwright"

import { ensureWorkerDisplay } from "./display"

type PersistentOptions = NonNullable<
  Parameters<typeof chromium.launchPersistentContext>[1]
>

function cleanEnv(display: string): Record<string, string> {
  const env: Record<string, string> = { DISPLAY: display }
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") env[key] = value
  }
  env.DISPLAY = display
  return env
}

/**
 * Lanza Chromium headed con DISPLAY explícito (Xvfb :99).
 */
export async function launchWorkerContext(
  profilePath: string,
  options: PersistentOptions = {}
) {
  const display = ensureWorkerDisplay()
  // Asegura que el proceso Node también lo tenga (Playwright a veces mira process.env)
  process.env.DISPLAY = display

  const { env: optionEnv, args: optionArgs, ...rest } = options

  return chromium.launchPersistentContext(profilePath, {
    headless: false,
    viewport: { width: 1360, height: 900 },
    acceptDownloads: true,
    ignoreDefaultArgs: ["--enable-automation"],
    ...rest,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--ozone-platform=x11",
      ...(optionArgs ?? []),
    ],
    env: {
      ...cleanEnv(display),
      ...(optionEnv as LaunchOptions["env"]),
      DISPLAY: display,
    },
  })
}
