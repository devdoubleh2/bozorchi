// backend/src/routes/checkout.ts
import express from "express";
import { polarApi } from "@/services/polar";
import { createAuthMiddleware, createAuthHandler, isEffectiveAdmin } from "@/middleware/auth";

const router: express.Router = express.Router();

router.use(createAuthMiddleware());

router.post(
  "/create-checkout",
  createAuthHandler(async (req, res) => {
    const { customerEmail, organizationId } = req.body;


    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!organizationId) {
      res.status(400).json({ error: "Organization ID is required" });
      return;
    }

    try {
      // Validate required environment variables
      const polarProductId = process.env["POLAR_PRODUCT_ID"];
      if (!polarProductId) {
        console.error("POLAR_PRODUCT_ID environment variable is not set");
        res.status(500).json({
          error: "Subscription service is not configured. Please contact support."
        });
        return;
      }



      if (req.organization?.id !== organizationId || !isEffectiveAdmin(req.user, req.userRole)) {
        res.status(403).json({ error: "Only organization owners and admins can manage billing" });
        return;
      }

      const rawFrontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
      const frontendUrl = rawFrontendUrl.startsWith("http://") || rawFrontendUrl.startsWith("https://")
        ? rawFrontendUrl
        : `https://${rawFrontendUrl}`;

      const checkout = await polarApi.checkouts.create({
        products: [polarProductId],
        customerEmail,
        embedOrigin: frontendUrl,
        successUrl: `${frontendUrl}/?checkout=success`,
        metadata: {
          organizationId: organizationId,
          userId: req.userId,
        },
      });

      res.json({ url: checkout.url, id: checkout.id });
      return;
    } catch (error) {
      console.error("Checkout creation failed:", error);
      res.status(500).json({ error: "Failed to create checkout" });
      return;
    }
  })
);

router.post(
  "/cancel-subscription",
  createAuthHandler(async (req, res) => {
    const { organizationId } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!organizationId) {
      res.status(400).json({ error: "Organization ID is required" });
      return;
    }

    try {
      // Verify ownership
      if (req.organization?.id !== organizationId || !isEffectiveAdmin(req.user, req.userRole)) {
        res.status(403).json({ error: "Only organization owners and admins can manage billing" });
        return;
      }

      if (!req.organization?.subscription_id) {
        res.status(400).json({ error: "No active subscription found" });
        return;
      }

      await polarApi.subscriptions.revoke({ id: req.organization.subscription_id });

      // Update DB immediately to reflect pending cancellation (optional, webhook will confirm)
      // But for UI responsiveness, we might want to fetch latest status

      res.json({
        message: "Subscription cancellation scheduled",
      });
      return;
    } catch (error) {
      console.error("Cancellation failed:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
      return;
    }
  })
);

export default router;
