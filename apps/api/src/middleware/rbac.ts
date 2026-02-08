import { Response, NextFunction } from "express";
import { Role } from "../generated/public/client";
import { AuthRequest } from "./auth";

/**
 * Middleware to check if user has admin role
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

    if (req.userRole !== Role.admin) {
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
  }
};

