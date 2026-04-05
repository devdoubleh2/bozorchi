import { z } from "zod";

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  platform: z.enum(["ios", "android"]),
  provider: z.string().min(1, "Provider is required"),
  deviceName: z.string().optional().nullable(),
  appVersion: z.string().optional().nullable(),
  buildNumber: z.string().optional().nullable(),
});

export const unregisterPushTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const sendTestNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  data: z.record(z.string(), z.string()).optional(),
});
