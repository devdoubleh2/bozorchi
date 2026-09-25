import { Request, Response } from "express";
import authService, { InviteError } from "../services/auth";
import logger from "../../logs/log"
import { AuthRequest, isOwner } from "../middleware/auth";
import { AppError } from "../utils/AppError";
import { sendSuccess, sendFail } from "../utils/responseHelpers";
import { toApiRole } from "../utils/roles";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      if (!result) {
        return sendFail(res, "Registration failed", 400);
      }

      const { user, token } = result;

      // Set token in HttpOnly cookie
      const isProduction = process.env["NODE_ENV"] === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      return sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
          membership: user.membership ?? null,
          owned_organization: user.owned_organization ?? null,
        },
      }, 201);
    } catch (error) {
      logger.error("Registration error", "authController");
      const code = error instanceof InviteError ? error.code : undefined;
      return sendFail(res, (error as Error).message, 400, undefined, code);
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return sendFail(res, "Email and password are required", 400);
      }

      const { user, token } = await authService.login({
        email,
        password,
      });

      logger.info("Login successful", "authController", {
        userId: user.id,
        email: user.email,
        organizationId:
          user.owned_organization?.id || user.membership?.organization_id,
        role: user.owned_organization
          ? "owner"
          : toApiRole(user.membership?.role ?? "user"),
      });

      // Set token in HttpOnly cookie
      const isProduction = process.env["NODE_ENV"] === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      return sendSuccess(res, {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
          membership: user.membership,
          owned_organization: user.owned_organization,
        },
      });
    } catch (error) {
      logger.warn("Login failed", "authController", {
        email,
        error: (error as Error).message,
      });
      return sendFail(res, "Invalid credentials", 401);
    }
  }

  async googleLogin(req: Request, res: Response) {
    const { idToken } = req.body;

    try {
      if (!idToken) {
        return sendFail(res, "Google ID token is required", 400);
      }

      const { user, token, needsOnboarding } = await authService.loginWithGoogle({
        idToken,
      });

      const isProduction = process.env["NODE_ENV"] === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return sendSuccess(res, {
        message: "Google login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
          membership: user.membership,
          owned_organization: user.owned_organization,
        },
        needsOnboarding: Boolean(needsOnboarding),
      });
    } catch (error) {
      logger.warn("Google login failed", "authController", {
        error: (error as Error).message,
      });
      return sendFail(res, (error as Error).message, 401);
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    if (!req.user) {
      logger.warn("Profile retrieval failed - user not found", "authController", {
        userId: req.userId,
      });
      throw new AppError("User not found", 404);
    }

    logger.info("Profile retrieved", "authController", {
      userId: req.user.id,
      email: req.user.email,
    });

    const { password_hash, ...user } = req.user;
    const membership = user.membership
      ? { ...user.membership, role: toApiRole(user.membership.role) }
      : user.membership;
    // Include membership and owned_organization for frontend permission checks
    return sendSuccess(res, {
      ...user,
      membership,
      owned_organization: user.owned_organization,
    });
  }

  async updatePassword(req: AuthRequest, res: Response) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      logger.warn("Password update failed - missing fields", "authController", {
        userId: req.userId,
      });
      throw new AppError("Current and new password required", 400);
    }
    if (newPassword.length < 6) {
      logger.warn("Password update failed - password too short", "authController", {
        userId: req.userId,
      });
      throw new AppError("Password must be at least 6 characters", 400);
    }

    await authService.changePassword(
      req.userId!,
      currentPassword,
      newPassword
    );

    logger.info("Password updated successfully", "authController", { userId: req.userId });
    return sendSuccess(res, { message: "Password updated successfully" });
  }

  async updateProfile(req: AuthRequest, res: Response) {
    const { email, name } = req.body;
    logger.info("Profile update attempt", "authController", {
      userId: req.userId,
      email,
      name,
    });

    if (!email) {
      logger.warn("Profile update failed - email required", "authController", {
        userId: req.userId,
      });
      throw new AppError("Email is required", 400);
    }

    const user = await authService.updateProfile({
      userId: req.userId!,
      email,
      name,
      storeId: req.store?.id,
      organizationId: req.organizationId,
    });

    logger.info("Profile updated successfully", "authController", {
      userId: req.userId,
      email,
    });

    return sendSuccess(res, { message: "Profile updated", user });
  }

  async deleteMe(req: AuthRequest, res: Response) {
    logger.warn("Account deletion attempt", "authController", {
      userId: req.userId,
      email: req.user?.email,
    });

    await authService.deleteUser(req);
    logger.info("Account deleted successfully", "authController", {
      userId: req.userId,
    });
    return sendSuccess(res, { message: "Account deleted" });
  }

  async forgotPassword(req: Request, res: Response) {
    const successMsg = "If an account exists, a reset link has been sent.";
    const result = await authService.requestPasswordReset(req.body.email);
    if (result) {
      // TODO: Send email with reset link in production
      logger.info("Reset URL:", "authController", {
        url: `${process.env["FRONTEND_URL"] || "http://localhost:5173"
          }/reset-password?token=${result.token}`,
      });
    }
    return sendSuccess(res, { message: successMsg });
  }

  async resetPassword(req: Request, res: Response) {
    logger.info("Password reset attempt", "authController");

    await authService.resetPassword(req.body.token, req.body.password);
    logger.info("Password reset successfully", "authController");
    return sendSuccess(res, { message: "Password reset successfully" });
  }

  async assignStore(req: AuthRequest, res: Response) {
    const { storeId } = req.body;

    logger.info("Assign store attempt", "authController", {
      userId: req.userId,
      targetStoreId: storeId,
      organizationId: req.organizationId,
    });

    if (!req.userId || !req.organizationId) {
      logger.warn("Assign store failed - missing context", "authController", {
        userId: req.userId,
        organizationId: req.organizationId,
      });
      throw new AppError("Authentication required", 401);
    }

    if (!storeId) {
      logger.warn("Assign store failed - no store ID", "authController", {
        userId: req.userId,
      });
      throw new AppError("Store ID is required", 400);
    }

    if (!req.tenantPrisma) {
      logger.error("Assign store failed - tenant database not initialized", "authController", {
        userId: req.userId,
        storeId,
      });
      throw new AppError("Tenant database not initialized", 500);
    }

    // Verify store exists and belongs to organization
    const store = await req.tenantPrisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || store.organization_id !== req.organizationId) {
      logger.warn("Assign store failed - store not found or unauthorized", "authController", {
        userId: req.userId,
        storeId,
        organizationId: req.organizationId,
      });
      throw new AppError("Store not found", 404);
    }

    // Security check: Only allow store assignment if:
    // 1. User is owner (can manage assignments), OR
    // 2. User has NO current store assignment (first-time onboarding)
    const ownerAccess = isOwner(req.user);
    const hasExistingAssignment = !!req.user?.membership?.store_id;

    if (!ownerAccess && hasExistingAssignment) {
      logger.warn("Assign store failed - user cannot reassign themselves", "authController", {
        userId: req.userId,
        targetStoreId: storeId,
        currentStoreId: req.user?.membership?.store_id,
        role: req.userRole,
      });
      throw new AppError("Cannot change store assignment. Contact your owner.", 403);
    }

    // Update user's store assignment in public schema
    const updatedMembership = await req.prisma.userOrganization.update({
      where: { user_id: req.userId },
      data: { store_id: storeId },
      select: { approved: true },
    });

    logger.info("Store assigned successfully", "authController", {
      userId: req.userId,
      storeId,
      organizationId: req.organizationId,
    });

    return sendSuccess(res, {
      message: "Store assigned successfully",
      store,
      approved: updatedMembership.approved,
    });
  }
}
