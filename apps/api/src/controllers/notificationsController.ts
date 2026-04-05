import { Response } from "express";
import { randomUUID } from "crypto";
import { getTenantPrisma, prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { fcmService } from "../services/fcm";

export class NotificationsController {
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        // @ts-ignore - notification model may not exist in some environments yet
        const tenantPrisma = await getTenantPrisma(req.organizationId!);
        const count = await tenantPrisma.notification.count({
          where: {
            userId,
            read: false,
          },
        });
        return res.json({ count });
      } catch (_error) {
        return res.json({ count: 0 });
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async registerPushToken(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { token, platform, provider, deviceName, appVersion, buildNumber } =
        req.body as {
          token: string;
          platform: string;
          provider: string;
          deviceName?: string | null;
          appVersion?: string | null;
          buildNumber?: string | null;
        };

      const now = new Date();
      const existing = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM mobile_push_tokens
        WHERE token = ${token}
        LIMIT 1
      `;

      if (existing.length > 0) {
        await prisma.$executeRaw`
          UPDATE mobile_push_tokens
          SET
            user_id = ${req.userId},
            platform = ${platform},
            provider = ${provider},
            device_name = ${deviceName ?? null},
            app_version = ${appVersion ?? null},
            build_number = ${buildNumber ?? null},
            updated_at = ${now},
            last_seen_at = ${now}
          WHERE token = ${token}
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO mobile_push_tokens (
            id,
            user_id,
            token,
            platform,
            provider,
            device_name,
            app_version,
            build_number,
            created_at,
            updated_at,
            last_seen_at
          ) VALUES (
            ${randomUUID()},
            ${req.userId},
            ${token},
            ${platform},
            ${provider},
            ${deviceName ?? null},
            ${appVersion ?? null},
            ${buildNumber ?? null},
            ${now},
            ${now},
            ${now}
          )
        `;
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Error registering push token:", error);
      return res.status(500).json({ error: "Failed to register push token" });
    }
  }

  async unregisterPushToken(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { token } = req.body as { token: string };

      await prisma.$executeRaw`
        DELETE FROM mobile_push_tokens
        WHERE user_id = ${req.userId}
          AND token = ${token}
      `;

      return res.json({ success: true });
    } catch (error) {
      console.error("Error unregistering push token:", error);
      return res.status(500).json({ error: "Failed to unregister push token" });
    }
  }

  async sendTestNotification(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { title, body, data } = req.body as {
        title: string;
        body: string;
        data?: Record<string, string>;
      };

      const sent = await fcmService.sendToUser(req.userId, {
        title,
        body,
        data,
      });

      return res.json({ success: sent });
    } catch (error) {
      console.error("Error sending test notification:", error);
      return res.status(500).json({ error: "Failed to send test notification" });
    }
  }
}
