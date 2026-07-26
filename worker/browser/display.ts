/**
 * Garantiza DISPLAY para Playwright headed (Xvfb :99).
 */
export function ensureWorkerDisplay() {
  if (!process.env.DISPLAY) {
    process.env.DISPLAY = ":99"
  }
  return process.env.DISPLAY
}
