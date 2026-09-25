/**
 * Authentication Middleware
 *
 * Validates JWT tokens and sets up request context with user, organization, and store data.
 */

import { Request, Response, NextFunction, RequestHandler } from "express";
import authService from "../services/auth";
import type { Store } from "../generated/tenant/client";
import { Role, Organization } from "../generated/public/client";
import { prisma, getTenantPrisma } from "../lib/prisma";
import logger from "../../logs/log"

// ============================================================================
// TYPES
// ============================================================================

export enum AuthErrorCode {
  TOKEN_MISSING = "TOKEN_MISSING",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  STORE_NOT_FOUND = "STORE_NOT_FOUND",
  NO_ORG_ACCESS = "NO_ORG_ACCESS",
  TENANT_ERROR = "TENANT_ERROR",
}

interface UserWithRelations {
  id: string;
  email: string;
  name: string | null;
  password_hash?: string | null;
  created_at?: Date;
  updated_at?: Date;
  push_token?: string | null;
  owned_organization?: Organization | null;
  membership?: {
    id: string;
    user_id: string;
    organization_id: string;
    store_id: string | null;
    role: Role;
    permissions: string[];
    approved: boolean;
    organization: Organization;
  } | null;
}

export interface AuthRequest extends Request {
  userId: string;
  user: UserWithRelations;
  userRole: Role;
  store: Store;
  organization?: Organization;
  userStores: Store[];
  prisma: typeof prisma;
  organizationId?: string;
  userApproved: boolean;
  tenantPrisma?: Awaited<ReturnType<typeof getTenantPrisma>>;
}

export interface AuthMiddlewareOptions {
  requireStore?: boolean;
  requireOrg?: boolean;
  allowPending?: boolean;
}

export const isOwner = (user: UserWithRelations): boolean =>
  !!user.owned_organization;

export const resolveUserRole = (
  user: Pick<UserWithRelations, "owned_organization">,
  membershipRole?: Role | string | null
): Role =>
  isOwner(user as UserWithRelations) || membershipRole === Role.admin
    ? Role.admin
    : Role.user;

export const isEffectiveAdmin = (
  user: Pick<UserWithRelations, "owned_organization">,
  membershipRole?: Role | string | null
): boolean => resolveUserRole(user, membershipRole) === Role.admin;

// just passing the types.
export const createAuthHandler = (
  handler: (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => Promise<Response | void> | Response | void
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await handler(req as AuthRequest, res, next);
    } catch (error) {
      return next(error);
    }
  };
};

export const createAuthMiddleware =
  (options: AuthMiddlewareOptions = {}): RequestHandler =>
    async (req, res, next) => {
      const { requireStore = true, requireOrg = true, allowPending = false } = options;
      const authReq = req as AuthRequest;

      try {
        const startTime = Date.now();

        // Extract token from HttpOnly cookie.
        const token = req.cookies?.token;
        if (!token) {
          return res.status(401).json({
            error: "Access token required",
            code: AuthErrorCode.TOKEN_MISSING,
          });
        }

        let decoded: { userId: string; organizationId?: string; activeStoreId?: string };
        try {
          decoded = authService.verifyToken(token);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          const code = message.includes("expired")
            ? AuthErrorCode.TOKEN_EXPIRED
            : AuthErrorCode.TOKEN_INVALID;
          const status = message.includes("expired") ? 401 : 403;
          return res.status(status).json({
            error: message.includes("expired")
              ? "Token has expired"
              : "Invalid token",
            code,
          });
        }

        authReq.userId = decoded.userId;

        // Fetch user with owned organization
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { owned_organization: true },
        });

        if (!user) {
          return res.status(401).json({
            error: "User not found",
            code: AuthErrorCode.USER_NOT_FOUND,
          });
        }

        // Fetch membership
        const membership = await prisma.userOrganization.findUnique({
          where: { user_id: user.id },
          select: {
            id: true,
            user_id: true,
            organization_id: true,
            store_id: true,
            role: true,
            permissions: true,
            approved: true,
            organization: true,
          },
        });

        if (!membership) {
          if (!requireOrg) {
            const normalizedUser: UserWithRelations = {
              ...user,
              membership: null,
            };
            authReq.user = normalizedUser;
            authReq.userRole = resolveUserRole(normalizedUser);
            authReq.userStores = [];
            authReq.userApproved = false;
            authReq.prisma = prisma;
            return next();
          }

          return res.status(403).json({
            error: "User has no organization membership",
            code: AuthErrorCode.NO_ORG_ACCESS,
          });
        }

        const normalizedUser: UserWithRelations = {
          ...user,
          membership: membership ?? null,
        };
        authReq.user = normalizedUser;
        // User is admin if they own the organization OR have admin role in membership
        authReq.userRole = resolveUserRole(normalizedUser, membership?.role);

        // Determine organization
        const organization =
          normalizedUser.owned_organization ?? membership?.organization;

        if (!organization) {
          if (requireOrg) {
            return res.status(403).json({
              error: "No organization found for user",
              code: AuthErrorCode.NO_ORG_ACCESS,
            });
          }
          authReq.userStores = [];
          authReq.userApproved = false;
          return next();
        }

        authReq.organization = organization;
        authReq.organizationId = organization.id;
        authReq.userApproved = membership?.approved ?? false;

        if (requireOrg && !authReq.userApproved && !isOwner(normalizedUser) && !allowPending) {
          return res.status(403).json({
            error: "Your organization membership is pending approval",
            code: AuthErrorCode.NO_ORG_ACCESS,
          });
        }

        authReq.prisma = prisma;

        // Initialize tenant Prisma client
        try {
          authReq.tenantPrisma = await getTenantPrisma(organization.id);
        } catch (error) {
          logger.error("Failed to initialize tenant Prisma", "authMiddleware", {
            orgId: organization.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return res.status(500).json({
            error: "Failed to access organization data",
            code: AuthErrorCode.NO_ORG_ACCESS,
          });
        }

        // Fetch stores
        let userStores: Store[] = [];
        try {
          userStores = await authReq.tenantPrisma.store.findMany({
            where: { organization_id: organization.id },
            orderBy: { created_at: "asc" },
          });
        } catch (error) {
          logger.debug("no stores for the founder.", "authMiddleware");
          userStores = [];
        }
        authReq.userStores = userStores;

        // Select active store
        if (requireStore) {
          const isOwnerOrAdmin = isEffectiveAdmin(normalizedUser, membership?.role);

          logger.debug("Store resolution:", "authMiddleware", {
            organizationId: organization.id,
            isOwnerOrAdmin,
            activeStoreIdFromToken: decoded.activeStoreId,
            assignedStoreId: membership.store_id,
          });

          let store = null;

          if (isOwnerOrAdmin) {
            // Owners/admins: use activeStoreId from JWT token (session-based)
            const activeStoreId = decoded.activeStoreId;

            if (activeStoreId) {
              store = await authReq.tenantPrisma.store.findUnique({
                where: {
                  id: activeStoreId,
                  organization_id: organization.id,
                },
              });
            }

            // Fallback to first store if no activeStoreId or store not found
            if (!store && authReq.userStores.length > 0) {
              store = authReq.userStores[0];
              logger.debug("Using first store as fallback for owner/admin", "authMiddleware", {
                storeId: store?.id,
              });
            }
          } else {
            // Regular users: use their assigned store_id from database
            store = membership.store_id
              ? await authReq.tenantPrisma.store.findUnique({
                where: {
                  id: membership.store_id,
                  organization_id: organization.id,
                },
              })
              : null;
          }

          logger.debug("Resolved store for user:", "authMiddleware", { storeId: store?.id, store });

          if (!store) {
            return res.status(404).json({
              error: "No stores available",
              code: AuthErrorCode.STORE_NOT_FOUND,
            });
          }

          authReq.store = store;
        }

        logger.debug("Auth completed", "authMiddleware", {
          userId: authReq.userId,
          orgId: authReq.organizationId,
          storeId: authReq.store?.id,
          ms: Date.now() - startTime,
        });

        next();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown";

        // Check if this is a Prisma/database error (tenant schema issue)
        const isPrismaError = errorMessage.includes("does not exist") ||
          errorMessage.includes("prisma") ||
          errorMessage.includes("Invalid");

        logger.error("Auth error", "authMiddleware", {
          error: errorMessage,
          isPrismaError,
          userId: authReq.userId,
        });

        // Return specific error code based on error type
        if (isPrismaError) {
          return res.status(503).json({
            error: "Tenant database not available. Please contact support.",
            code: AuthErrorCode.TENANT_ERROR,
            details: errorMessage,
          });
        } else {
          return res.status(500).json({
            error: "Authentication failed",
            code: AuthErrorCode.TOKEN_INVALID,
          });
        }
      }
    };
