// backend/src/routes/webhook.ts
import express from "express";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { prisma } from "@/lib/prisma";
import { log } from "../../logs/log";

const router: express.Router = express.Router();


router.post(
  "/polar",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const webhookSecret = process.env["POLAR_WEBHOOK_SECRET"];

    if (!webhookSecret) {
      log.error("webhook", "POLAR_WEBHOOK_SECRET is not set");
      res.status(500).send("Webhook secret not configured");
      return;
    }

    log.info("webhook", "Incoming Polar webhook request", {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
    });

    let event;
    try {
      // If using express.raw(), req.body is a Buffer.
      const body =
        req.body instanceof Buffer
          ? req.body.toString("utf8")
          : JSON.stringify(req.body);

      log.debug("webhook", "Raw webhook body received", { body });

      const headers = req.headers as Record<string, string>;

      event = validateEvent(body, headers, webhookSecret);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        log.error("webhook", "Webhook verification failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(400).send("Invalid signature");
        return;
      }
      log.error("webhook", "Webhook processing error before validation", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(400).send("Bad request");
      return;
    }

    log.info("webhook", "Webhook event validated", {
      type: event.type,
    });

    try {
      if (
        event.type === "subscription.created" ||
        event.type === "subscription.updated"
      ) {
        const subscription = event.data;
        const organizationId = subscription.metadata["organizationId"] as string;

        log.debug("webhook", "Processing subscription created/updated", {
          subscriptionId: subscription.id,
          organizationId,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        });

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_ends_at: subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd)
                : null,
            },
          });
          log.info("webhook", "Updated organization with active subscription", {
            organizationId,
            subscriptionId: subscription.id,
            status: subscription.status,
          });
        } else {
          log.warn("webhook", "Subscription event missing organizationId metadata", {
            subscriptionId: subscription.id,
            metadata: subscription.metadata,
          });
        }
      } else if (
        event.type === "subscription.canceled" ||
        event.type === "subscription.revoked"
      ) {
        const subscription = event.data;
        const organizationId = subscription.metadata["organizationId"] as string;

        log.debug("webhook", "Processing subscription canceled/revoked", {
          subscriptionId: subscription.id,
          organizationId,
          status: subscription.status,
        });

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscription_status: "canceled", // or 'revoked' depending on exact status
              // We might want to keep the ID for reference or clear it
            },
          });
          log.info("webhook", "Canceled subscription for organization", {
            organizationId,
            subscriptionId: subscription.id,
          });
        }
      } else {
        log.info("webhook", "Unhandled webhook event type (ignored)", {
          type: event.type,
        });
      }
    } catch (error) {
      log.error("webhook", "Database update failed", {
        error: error instanceof Error ? error.message : String(error),
        eventType: event?.type,
      });
      res.status(500).send("Internal server error");
      return;
    }

    log.info("webhook", "Webhook processed successfully", {
      eventType: event.type,
    });

    res.status(200).send("OK");
    return;
  }
);

export default router;
