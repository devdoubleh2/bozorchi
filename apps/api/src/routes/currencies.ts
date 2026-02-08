import { Router } from "express";
import { CurrenciesController } from "../controllers/currenciesController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import {
    validateRequest,
    validateParams,
} from "../middleware/validation";
import { z } from "zod";

const router: Router = Router();
const currenciesController = new CurrenciesController();

// Validation schemas
const currencySchema = z.object({
    code: z.string().min(1, "Code required").max(3),
    name: z.string().min(1, "Name required"),
    symbol: z.string().min(1, "Symbol required"),
    rate: z.coerce.number().min(0, "Rate must be positive"),
    is_base: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

const currencyIdParamSchema = z.object({
    id: z.string().min(1, "Currency ID is required"),
});

// All routes require authentication
router.use(createAuthMiddleware());

// Routes
router.get(
    "/",
    createAuthHandler(currenciesController.getAllCurrencies)
);

router.post(
    "/",
    validateRequest(currencySchema),
    createAuthHandler(currenciesController.createCurrency)
);

router.put(
    "/:id",
    validateParams(currencyIdParamSchema),
    createAuthHandler(currenciesController.updateCurrency)
);

router.delete(
    "/:id",
    validateParams(currencyIdParamSchema),
    createAuthHandler(currenciesController.deleteCurrency)
);

export default router;
