import { Router } from "express";
import { CustomersController } from "../controllers/customersController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";

const router: Router = Router();
const customersController = new CustomersController();

// Apply authentication middleware with store requirement
router.use(createAuthMiddleware({ requireStore: true }));

// Customer routes
router.get("/", createAuthHandler(customersController.getCustomers));
router.get("/:id", createAuthHandler(customersController.getCustomer));
router.post("/", createAuthHandler(customersController.createCustomer));
router.put("/:id", createAuthHandler(customersController.updateCustomer));
router.delete("/:id", createAuthHandler(customersController.deleteCustomer));

// Loyalty card routes
router.post(
  "/loyalty-cards",
  createAuthHandler(customersController.createLoyaltyCard)
);
router.put(
  "/:customer_id/loyalty-points",
  createAuthHandler(customersController.updateLoyaltyPoints)
);
router.delete(
  "/:customer_id/loyalty-card",
  createAuthHandler(customersController.deleteLoyaltyCard)
);

export default router;
