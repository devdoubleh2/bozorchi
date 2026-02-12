import { Request, Response } from "express";
import authService from "../services/auth";
import logger from "../../logs/log"
import { AuthRequest } from "../middleware/auth";

export class AuthController {
  async register(req: Request, res: Response) {


    try {
      const result = await authService.register(req.body);
      if (!result) {
        return res.status(400).json({ error: "Registration failed" });
      }

      const { user, token } = result;


      // Set token in HttpOnly cookie
      const isProduction = process.env["NODE_ENV"] === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      logger.error("Registration error", "authController");
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
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
        role: user.owned_organization ? "admin" : user.membership?.role,
      });

      // Set token in HttpOnly cookie
      const isProduction = process.env["NODE_ENV"] === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.json({
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
      return res.status(401).json({
        error: "Invalid credentials",
        message: (error as Error).message,
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    if (!req.user) {
      logger.warn("Profile retrieval failed - user not found", "authController", {
        userId: req.userId,
      });
      return res.status(404).json({ error: "User not found" });
    }

    logger.info("Profile retrieved", "authController", {
      userId: req.user.id,
      email: req.user.email,
    });

    const { password_hash, ...user } = req.user;
    // Include membership and owned_organization for frontend permission checks
    return res.json({
      ...user,
      membership: user.membership,
      owned_organization: user.owned_organization,
    });
  }

  async updatePassword(req: AuthRequest, res: Response) {
    logger.info("Password update attempt", "authController", { userId: req.userId });

    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        logger.warn("Password update failed - missing fields", "authController", {
          userId: req.userId,
        });
        return res
          .status(400)
          .json({ error: "Current and new password required" });
      }
      if (newPassword.length < 6) {
        logger.warn("Password update failed - password too short", "authController", {
          userId: req.userId,
        });
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }
      await authService.changePassword(
        req.userId!,
        currentPassword,
        newPassword
      );

      logger.info("Password updated successfully", "authController", { userId: req.userId });
      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      logger.error("Password update error", "authController", {
        userId: req.userId,
        error: (error as Error).message,
      });
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    const { email, name } = req.body;
    logger.info("Profile update attempt", "authController", {
      userId: req.userId,
      email,
      name,
    });

    try {
      if (!email) {
        logger.warn("Profile update failed - email required", "authController", {
          userId: req.userId,
        });
        return res.status(400).json({ error: "Email is required" });
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

      return res.json({ message: "Profile updated", user });
    } catch (error) {
      const msg = (error as Error).message;
      logger.error("Profile update error", "authController", {
        userId: req.userId,
        email,
        error: msg,
      });
      return res
        .status(msg === "Email is already taken" ? 409 : 400)
        .json({ error: msg });
    }
  }

  async deleteMe(req: AuthRequest, res: Response) {
    logger.warn("Account deletion attempt", "authController", {
      userId: req.userId,
      email: req.user?.email,
    });

    try {
      await authService.deleteUser(req);
      logger.info("Account deleted successfully", "authController", {
        userId: req.userId,
      });
      return res.json({ message: "Account deleted" });
    } catch (error) {
      logger.error("Account deletion error", "authController", {
        userId: req.userId,
        error: (error as Error).message,
      });
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const successMsg = "If an account exists, a reset link has been sent.";
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      if (result) {
        // TODO: Send email with reset link in production
        logger.info("Reset URL:", "authController", {
          url: `${process.env["FRONTEND_URL"] || "http://localhost:5173"
            }/reset-password?token=${result.token}`,
        });
      }
      return res.json({ message: successMsg });
    } catch {
      return res.json({ message: successMsg });
    }
  }

  async resetPassword(req: Request, res: Response) {
    logger.info("Password reset attempt", "authController");

    try {
      await authService.resetPassword(req.body.token, req.body.password);
      logger.info("Password reset successfully", "authController");
      return res.json({ message: "Password reset successfully" });
    } catch (error) {
      logger.error("Password reset error", "authController", {
        error: (error as Error).message,
      });
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  async assignStore(req: AuthRequest, res: Response) {
    const { storeId } = req.body;

    logger.info("Assign store attempt", "authController", {
      userId: req.userId,
      targetStoreId: storeId,
      organizationId: req.organizationId,
    });

    try {
      if (!req.userId || !req.organizationId) {
        logger.warn("Assign store failed - missing context", "authController", {
          userId: req.userId,
          organizationId: req.organizationId,
        });
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      if (!storeId) {
        logger.warn("Assign store failed - no store ID", "authController", {
          userId: req.userId,
        });
        return res.status(400).json({
          error: "Store ID is required",
        });
      }

      if (!req.tenantPrisma) {
        logger.error("Assign store failed - tenant database not initialized", "authController", {
          userId: req.userId,
          storeId,
        });
        return res.status(500).json({
          error: "Tenant database not initialized",
        });
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
        return res.status(404).json({
          error: "Store not found",
        });
      }

      // Security check: Only allow store assignment if:
      // 1. User is owner/admin (can manage assignments), OR
      // 2. User has NO current store assignment (first-time onboarding)
      const isOwner = !!req.user?.owned_organization;
      const isAdmin = req.userRole === "admin";
      const hasExistingAssignment = !!req.user?.membership?.store_id;

      if (!isOwner && !isAdmin && hasExistingAssignment) {
        logger.warn("Assign store failed - user cannot reassign themselves", "authController", {
          userId: req.userId,
          targetStoreId: storeId,
          currentStoreId: req.user?.membership?.store_id,
          role: req.userRole,
        });
        return res.status(403).json({
          error: "Cannot change store assignment. Contact your administrator.",
        });
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

      return res.json({
        message: "Store assigned successfully",
        store,
        approved: updatedMembership.approved,
      });
    } catch (error) {
      logger.error("Assign store error", "authController", {
        error: (error as Error).message,
        userId: req.userId,
        storeId,
      });
      return res.status(500).json({
        error: "Failed to assign store",
        message: (error as Error).message,
      });
    }
  }
}
