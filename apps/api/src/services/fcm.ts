import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getMessaging, Messaging, MulticastMessage } from "firebase-admin/messaging";
import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/public/client";
import logger from "../../logs/log";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type MobilePushTokenRow = {
  token: string;
};

class FcmService {
  private app: App | null = null;
  private messaging: Messaging | null = null;

  private resolveCredentialsPath(): string | null {
    const explicitPath = process.env["GOOGLE_APPLICATION_CREDENTIALS"];
    if (explicitPath && fs.existsSync(explicitPath)) {
      return explicitPath;
    }

    const candidates = [
      path.resolve(process.cwd(), ".secrets/bozorchi-8b209-firebase-admin.json"),
      path.resolve(process.cwd(), "../.secrets/bozorchi-8b209-firebase-admin.json"),
      path.resolve(process.cwd(), "../../.secrets/bozorchi-8b209-firebase-admin.json"),
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
  }

  private getMessagingClient(): Messaging | null {
    if (this.messaging) {
      return this.messaging;
    }

    const projectId = process.env["FIREBASE_PROJECT_ID"] || "bozorchi-8b209";
    const credentialsPath = this.resolveCredentialsPath();

    if (!credentialsPath) {
      logger.warn("FCM credentials file not found", "fcmService", { projectId });
      return null;
    }

    try {
      const existingApp = getApps().find((app) => app.name === "bozorchi-fcm");

      this.app =
        existingApp ??
        initializeApp(
          {
            credential: cert(JSON.parse(fs.readFileSync(credentialsPath, "utf8"))),
            projectId,
          },
          "bozorchi-fcm"
        );

      this.messaging = getMessaging(this.app);
      return this.messaging;
    } catch (error) {
      logger.error("Failed to initialize Firebase Admin", "fcmService", {
        error: error instanceof Error ? error.message : String(error),
        credentialsPath,
        projectId,
      });
      return null;
    }
  }

  private async getTokensForUser(userId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<MobilePushTokenRow[]>`
      SELECT token
      FROM mobile_push_tokens
      WHERE user_id = ${userId}
    `;

    return rows.map((row) => row.token);
  }

  private async deleteTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    await prisma.$executeRaw`
      DELETE FROM mobile_push_tokens
      WHERE token IN (${Prisma.join(tokens)})
    `;
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<boolean> {
    const messaging = this.getMessagingClient();
    if (!messaging) {
      return false;
    }

    const tokens = await this.getTokensForUser(userId);
    if (tokens.length === 0) {
      logger.info("No mobile push tokens for user", "fcmService", { userId });
      return false;
    }

    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: "high",
        notification: {
          channelId: "default",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    const invalidTokens = response.responses
      .map((result, index) => ({ result, token: tokens[index] }))
      .filter(({ result }) => {
        const code = result.error?.code;
        return (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        );
      })
      .map(({ token }) => token)
      .filter((token): token is string => typeof token === "string");

    await this.deleteTokens(invalidTokens);

    logger.info("FCM send completed", "fcmService", {
      userId,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokensRemoved: invalidTokens.length,
    });

    return response.successCount > 0;
  }

  async sendToOrganizationOwner(
    organizationId: string,
    payload: PushPayload
  ): Promise<boolean> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { owner_id: true },
    });

    if (!organization?.owner_id) {
      logger.warn("Organization owner not found for push send", "fcmService", {
        organizationId,
      });
      return false;
    }

    return this.sendToUser(organization.owner_id, payload);
  }
}

export const fcmService = new FcmService();
