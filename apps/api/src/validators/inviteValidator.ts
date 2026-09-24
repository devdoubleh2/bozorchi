import { z } from "zod";
import { MAX_INVITE_TTL_DAYS } from "../services/invites";

export const createInviteSchema = z.object({
  store_id: z.string().min(1, "Store ID is required"),
  expires_in_days: z
    .number()
    .int("Expiry must be a whole number of days")
    .min(1, "Expiry must be at least 1 day")
    .max(MAX_INVITE_TTL_DAYS, `Expiry must be at most ${MAX_INVITE_TTL_DAYS} days`)
    .optional(),
});

export const inviteIdParamSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
});
