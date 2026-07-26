import { chromium, type LaunchOptions } from "playwright"

import { ensureWorkerDisplay } from "./display"

type PersistentOptions = NonNullable<
  Parameters<typeof chromium.launchPersistentContext>[1]
>

/**
 * Lanza Chromium headed con DISPLAY explícito (Xvfb :99).
 * PM2 a veces no hereda env; lo inyectamos en el proceso de Chrome.
 */
export async function launchWorkerContext(
  profilePath: string,
  options: PersistentOptions = {}
) {
  const display = ensureWorkerDisplay()
  const { env: optionEnv, args: optionArgs, ...rest } = options

  return chromium.launchPersistentContext(profilePath, {
    headless: false,
    viewport: { width: 1360, height: 900 },
    acceptDownloads: true,
    ...rest,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      ...(optionArgs ?? []),
    ],
    env: {
      ...process.env,
      ...(optionEnv as LaunchOptions["env"]),
      DISPLAY: display,
    },
  })
}
