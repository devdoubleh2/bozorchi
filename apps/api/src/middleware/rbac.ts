import { RequestHandler, Response, NextFunction } from "express";
import { Permission } from "../generated/public/client";
import { AuthRequest, isEffectiveAdmin, requestMembershipRole } from "./auth";

/**
 * Middleware to check staff-management access: owners (organization owner
 * link) OR admin memberships. Cashiers are denied.
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (!req.userRole) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User role not found",
      });
      return;
    }

    if (!req.userApproved) {
      res.status(403).json({
        error: "Access denied",
        message: "Membership approval required",
      });
      return;
    }

    if (
      !isEffectiveAdmin(req.user, requestMembershipRole(req))
    ) {
      res.status(403).json({
        error: "Access denied",
        message: "Admin privileges required",
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: "Authorization check failed",
      message: (error as Error).message,
    });
    return;
  }
};

interface PermissionCheckOptions {
  requireAll?: boolean;
}

const userHasPermission = (
  req: AuthRequest,
  permission: Permission
): boolean => {
  if (!req.userId || !req.userRole || !req.userApproved) {
    return false;
  }

  if (isEffectiveAdmin(req.user, requestMembershipRole(req))) {
    return true;
  }

  const membershipPermissions = req.user?.membership?.permissions ?? [];
  return membershipPermissions.includes(permission);
};

export const requirePermission =
  (
    permissions: Permission[],
    options: PermissionCheckOptions = {}
  ): RequestHandler =>
    async (req, res, next): Promise<void> => {
      const authReq = req as AuthRequest;
      try {
        if (!authReq.userId || !authReq.userRole) {
          res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required",
          });
          return;
        }

        if (permissions.length === 0) {
          next();
          return;
        }

        const { requireAll = false } = options;
        const hasPermission = requireAll
          ? permissions.every((permission) =>
            userHasPermission(authReq, permission)
          )
          : permissions.some((permission) =>
            userHasPermission(authReq, permission)
          );

        if (!hasPermission) {
          res.status(403).json({
            error: "Access denied",
            message: "Insufficient permissions",
            requiredPermissions: permissions,
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({
          error: "Authorization check failed",
          message: (error as Error).message,
        });
        return;
      }
    };
