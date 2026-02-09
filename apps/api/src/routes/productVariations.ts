import { Router } from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { ProductVariationsController } from "../controllers/productVariationsController";

const router: Router = Router();
const controller = new ProductVariationsController();

router.get("/:id", createAuthMiddleware(), createAuthHandler(controller.getProductVariation));

export default router;
