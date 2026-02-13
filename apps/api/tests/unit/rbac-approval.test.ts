import { describe, expect, it, mock } from "bun:test";
import type { NextFunction, Response } from "express";
import { requireAdmin, requirePermission } from "../../src/middleware/rbac";
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
