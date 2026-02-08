import { Router } from "express";
import {
  createAuthHandler,
  createAuthMiddleware,
  AuthRequest,
} from "../middleware/auth";
import { validateQuery } from "../middleware/validation";
import { z } from "zod";
import { Response } from "express";
import {
  getSellerPerformance,
  getProductPerformance,
  SellerReportResponse,
  ProductReportResponse,
} from "../services/reports";
import { prisma as publicPrisma } from "../lib/prisma";

const router: Router = Router();

// Query schema for date filtering
const reportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["revenue", "quantity", "profit"]).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

type ReportQuery = z.infer<typeof reportQuerySchema>;

// Helper to parse date strings
function parseDateRange(query: ReportQuery): {
  startDate?: Date;
  endDate?: Date;
} {
  return {
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
  };
}

// All routes require authentication
router.use(createAuthMiddleware());

/**
 * GET /api/reports/sellers
 * Get seller performance report with sales aggregated by user
 */
router.get(
  "/sellers",
  validateQuery(reportQuerySchema),
  createAuthHandler(async (req: AuthRequest, res: Response) => {
    if (!req.store?.id) {
      return res.status(400).json({ error: "Store context is required" });
    }

    if (!req.tenantPrisma) {
      return res.status(500).json({ error: "Database connection error" });
    }

    const query = req.query as ReportQuery;
    const dateRange = parseDateRange(query);

    try {
      // Get user names from public schema for better display
      const userNameMap = new Map<string, string>();
      try {
        // Get all users from public schema to map IDs to names
        const users = await publicPrisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        users.forEach((u) => {
          userNameMap.set(u.id, u.name || u.email || `User ${u.id.slice(-6)}`);
        });
      } catch {
        // If we can't get user names, continue without them
      }

      const report: SellerReportResponse = await getSellerPerformance(
        req.store.id,
        dateRange,
        req.tenantPrisma,
        userNameMap
      );

      return res.json(report);
    } catch (error) {
      console.error("Error generating seller report:", error);
      return res
        .status(500)
        .json({ error: "Failed to generate seller report" });
    }
  })
);

/**
 * GET /api/reports/products
 * Get product performance report with sales aggregated by product variation
 */
router.get(
  "/products",
  validateQuery(reportQuerySchema),
  createAuthHandler(async (req: AuthRequest, res: Response) => {
    if (!req.store?.id) {
      return res.status(400).json({ error: "Store context is required" });
    }

    if (!req.tenantPrisma) {
      return res.status(500).json({ error: "Database connection error" });
    }

    const query = req.query as ReportQuery;
    const dateRange = parseDateRange(query);

    try {
      const report: ProductReportResponse = await getProductPerformance(
        req.store.id,
        dateRange,
        req.tenantPrisma,
        query.sortBy || "revenue",
        query.limit
      );

      return res.json(report);
    } catch (error) {
      console.error("Error generating product report:", error);
      return res
        .status(500)
        .json({ error: "Failed to generate product report" });
    }
  })
);

export default router;
