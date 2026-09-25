import { describe, expect, it, mock } from "bun:test";
import type { NextFunction, Response } from "express";
import { requireOwner, requirePermission } from "../../src/middleware/rbac";
import { isOwner, resolveUserRole } from "../../src/middleware/auth";
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
      userRole: Role.cashier,
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
      userRole: Role.cashier,
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

  it("blocks unapproved owners", async () => {
    const req = {
      userId: "owner-1",
      userRole: Role.owner,
      userApproved: false,
      user: {
        owned_organization: { id: "org-1" },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await requireOwner(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(403);
  });
});

describe("Owner predicate (owner link only)", () => {
  it("derives ownership from the organization owner link only", () => {
    expect(isOwner({ owned_organization: { id: "org-1" } } as any)).toBe(true);
    expect(isOwner({ owned_organization: null } as any)).toBe(false);
  });

  it("resolves owner vs cashier roles", () => {
    const owner = { owned_organization: { id: "org-1" } } as any;
    expect(resolveUserRole(owner, Role.cashier)).toBe(Role.owner);
    expect(resolveUserRole(owner, null)).toBe(Role.owner);

    const cashier = { owned_organization: null } as any;
    expect(resolveUserRole(cashier, Role.cashier)).toBe(Role.cashier);
    expect(resolveUserRole(cashier, Role.owner)).toBe(Role.owner);
  });

  it("denies cashiers at the owner gate", () => {
    const cashier = { owned_organization: null } as any;
    expect(isOwner(cashier)).toBe(false);
  });

  it("denies a cashier membership without ownership through the owner gate", async () => {
    const req = {
      userId: "cashier-1",
      userRole: Role.cashier,
      userApproved: true,
      user: {
        owned_organization: null,
        membership: { role: Role.cashier, permissions: [] },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await requireOwner(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(403);
  });
});

describe("Owner rule (organization owner link only)", () => {
  it("treats an owner as owner even when the membership row says cashier", () => {
    const owner = { owned_organization: { id: "org-1" } } as any;
    expect(resolveUserRole(owner, Role.cashier)).toBe(Role.owner);
    expect(resolveUserRole(owner, null)).toBe(Role.owner);
    expect(isOwner(owner)).toBe(true);
  });

  it("treats a cashier as cashier", () => {
    const user = { owned_organization: null } as any;
    expect(resolveUserRole(user, Role.cashier)).toBe(Role.cashier);
    expect(isOwner(user)).toBe(false);
  });

  it("lets an owner through the owner gate", async () => {
    const req = {
      userId: "owner-1",
      userRole: Role.owner,
      userApproved: true,
      user: {
        owned_organization: { id: "org-1" },
        membership: { role: Role.owner, permissions: [] },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await requireOwner(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("denies an approved cashier at the owner gate", async () => {
    const req = {
      userId: "cashier-1",
      userRole: Role.cashier,
      userApproved: true,
      user: {
        owned_organization: null,
        membership: { role: Role.cashier, permissions: [Permission.POS_ACCESS] },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await requireOwner(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(403);
  });

  it("grants an owner POS access without explicit permissions", async () => {
    const req = {
      userId: "owner-1",
      userRole: Role.owner,
      userApproved: true,
      user: {
        owned_organization: { id: "org-1" },
        membership: { role: Role.owner, permissions: [] },
      },
    } as any;

    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;
    const middleware = requirePermission([Permission.POS_ACCESS]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
