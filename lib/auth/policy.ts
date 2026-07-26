export const MAX_FAILED_ATTEMPTS = 5
export const LOCK_MINUTES = 15

export function canAttemptLogin(
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  lockedUntil: Date | null,
  now = new Date()
) {
  return status === "ACTIVE" && (!lockedUntil || lockedUntil <= now)
}

export function nextLoginFailure(failedLoginAttempts: number, now = new Date()) {
  const failedAttempts = failedLoginAttempts + 1
  const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS

  return {
    failedLoginAttempts: shouldLock ? 0 : failedAttempts,
    lockedUntil: shouldLock
      ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
      : null,
  }
}
