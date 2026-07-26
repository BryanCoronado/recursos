import { describe, expect, it } from "vitest"

import { PERMISSIONS } from "./permissions"
import { canAttemptLogin, nextLoginFailure } from "./policy"
import {
  canDeleteRole,
  canGrantPermissions,
  canManageTargetRole,
  canRemoveSuperAdmin,
  hasPermission,
} from "./rbac"

describe("política de autenticación", () => {
  it("solo permite cuentas activas y sin bloqueo vigente", () => {
    const now = new Date("2026-07-21T18:00:00Z")

    expect(canAttemptLogin("ACTIVE", null, now)).toBe(true)
    expect(canAttemptLogin("SUSPENDED", null, now)).toBe(false)
    expect(canAttemptLogin("INACTIVE", null, now)).toBe(false)
    expect(
      canAttemptLogin("ACTIVE", new Date("2026-07-21T18:05:00Z"), now)
    ).toBe(false)
  })

  it("bloquea temporalmente después del quinto fallo", () => {
    const now = new Date("2026-07-21T18:00:00Z")
    const result = nextLoginFailure(4, now)

    expect(result.failedLoginAttempts).toBe(0)
    expect(result.lockedUntil).toEqual(new Date("2026-07-21T18:15:00Z"))
  })
})

describe("política RBAC", () => {
  it("concede únicamente permisos que el actor posee", () => {
    const actorPermissions = [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
    ]

    expect(
      canGrantPermissions(actorPermissions, [PERMISSIONS.USERS_READ])
    ).toBe(true)
    expect(
      canGrantPermissions(actorPermissions, [PERMISSIONS.ROLES_DELETE])
    ).toBe(false)
  })

  it("comprueba permisos concretos", () => {
    expect(
      hasPermission([PERMISSIONS.USERS_READ], PERMISSIONS.USERS_READ)
    ).toBe(true)
    expect(
      hasPermission([PERMISSIONS.USERS_READ], PERMISSIONS.USERS_UPDATE)
    ).toBe(false)
  })

  it("protege superadministradores y roles asignados", () => {
    expect(canManageTargetRole(false, true)).toBe(false)
    expect(canManageTargetRole(true, true)).toBe(true)
    expect(canRemoveSuperAdmin(true, 1)).toBe(false)
    expect(canRemoveSuperAdmin(true, 2)).toBe(true)
    expect(canDeleteRole(true, 0)).toBe(false)
    expect(canDeleteRole(false, 1)).toBe(false)
    expect(canDeleteRole(false, 0)).toBe(true)
  })
})
