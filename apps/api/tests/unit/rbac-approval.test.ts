import { describe, expect, it, mock } from "bun:test";
import type { NextFunction, Response } from "express";
import { requireAdmin, requirePermission } from "../../src/middleware/rbac";
import { isEffectiveAdmin, resolveUserRole } from "../../src/middleware/auth";
import { Permission, Role } from "../../src/generated/public/client";

const createMockResponse = () => {
  const response = {} as Response;
  (response as any).status = mock(() => response);
  (response as any).json = mock(() => response);
  return response;
};

describe("RBAC approval enforcement", () => {
  it("blocks unapproved users even when permission is present", async () => {
    const req = {
      userId: "user-1",
      userRole: Role.user,
      userApproved: false,
      user: {
        membership: {
          permissions: [Permission.POS_ACCESS],
        },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;
    const middleware = requirePermission([Permission.POS_ACCESS]);

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(403);
  });

  it("allows approved users with matching permission", async () => {
    const req = {
      userId: "user-2",
      userRole: Role.user,
      userApproved: true,
      user: {
        membership: {
          permissions: [Permission.POS_ACCESS],
        },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;
    const middleware = requirePermission([Permission.POS_ACCESS]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("blocks unapproved admins", async () => {
    const req = {
      userId: "admin-1",
      userRole: Role.admin,
      userApproved: false,
      user: {
        owned_organization: null,
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(403);
  });
});

describe("One owner rule (organization owner link OR admin membership)", () => {
  it("treats an owner as admin even when the membership row says user", () => {
    const owner = { owned_organization: { id: "org-1" } } as any;
    expect(resolveUserRole(owner, Role.user)).toBe(Role.admin);
    expect(resolveUserRole(owner, null)).toBe(Role.admin);
    expect(isEffectiveAdmin(owner, Role.user)).toBe(true);
  });

  it("treats an admin membership without ownership as admin", () => {
    const user = { owned_organization: null } as any;
    expect(resolveUserRole(user, Role.admin)).toBe(Role.admin);
    expect(isEffectiveAdmin(user, Role.admin)).toBe(true);
  });

  it("treats a cashier as non-admin", () => {
    const user = { owned_organization: null } as any;
    expect(resolveUserRole(user, Role.user)).toBe(Role.user);
    expect(isEffectiveAdmin(user, Role.user)).toBe(false);
  });

  it("lets an owner with a user membership through the admin gate", async () => {
    const req = {
      userId: "owner-1",
      userRole: Role.admin,
      userApproved: true,
      user: {
        owned_organization: { id: "org-1" },
        membership: { role: Role.user, permissions: [] },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("denies an approved cashier at the admin gate", async () => {
    const req = {
      userId: "cashier-1",
      userRole: Role.user,
      userApproved: true,
      user: {
        owned_organization: null,
        membership: { role: Role.user, permissions: [Permission.POS_ACCESS] },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(403);
  });

  it("grants an owner POS access without explicit permissions", async () => {
    const req = {
      userId: "owner-1",
      userRole: Role.admin,
      userApproved: true,
      user: {
        owned_organization: { id: "org-1" },
        membership: { role: Role.user, permissions: [] },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;
    const middleware = requirePermission([Permission.POS_ACCESS]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
