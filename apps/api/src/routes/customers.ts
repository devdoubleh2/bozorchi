import { Router } from "express";
import { CustomersController } from "../controllers/customersController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { Permission } from "../generated/public/client";

const router: Router = Router();
const customersController = new CustomersController();

// Apply authentication middleware with store requirement
router.use(createAuthMiddleware({ requireStore: true }));
const requirePOSAccess = requirePermission([Permission.POS_ACCESS]);

// Customer routes
router.get("/", requirePOSAccess, createAuthHandler(customersController.getCustomers));
router.get("/:id", requirePOSAccess, createAuthHandler(customersController.getCustomer));
router.post("/", requirePOSAccess, createAuthHandler(customersController.createCustomer));
router.put("/:id", requirePOSAccess, createAuthHandler(customersController.updateCustomer));
router.delete("/:id", requirePOSAccess, createAuthHandler(customersController.deleteCustomer));

// Loyalty card routes
router.post(
  "/loyalty-cards",
  requirePOSAccess,
  createAuthHandler(customersController.createLoyaltyCard)
);
router.put(
  "/:customer_id/loyalty-points",
  requirePOSAccess,
  createAuthHandler(customersController.updateLoyaltyPoints)
);
router.delete(
  "/:customer_id/loyalty-card",
  requirePOSAccess,
  createAuthHandler(customersController.deleteLoyaltyCard)
);

export default router;
