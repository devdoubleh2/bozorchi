import crypto from "crypto";
import { prisma, getTenantPrisma } from "../lib/prisma";
import logger from "../../logs/log";

export const INVITE_ERROR = "INVITE_INVALID";
export const INVITE_ERROR_MESSAGE =
  "This invite is expired, already used, or revoked. Ask your manager for a new invite.";

export const DEFAULT_INVITE_TTL_DAYS = 7;
export const MAX_INVITE_TTL_DAYS = 30;

export type InviteStatus = "outstanding" | "used" | "revoked" | "expired";

export interface InviteRecord {
  id: string;
  organization_id: string;
  store_id: string;
  store_name: string | null;
  expires_at: Date;
  used_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  status: InviteStatus;
}

export const hashInviteToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const toStatus = (invite: {
  used_at: Date | null;
  revoked_at: Date | null;
  expires_at: Date;
}): InviteStatus => {
  if (invite.used_at) return "used";
  if (invite.revoked_at) return "revoked";
  if (invite.expires_at.getTime() <= Date.now()) return "expired";
  return "outstanding";
};

class InviteService {
  async createInvite(data: {
    organizationId: string;
    storeId: string;
    createdBy: string;
    expiresInDays?: number;
  }): Promise<{ invite: InviteRecord; token: string }> {
    const tenantPrisma = await getTenantPrisma(data.organizationId);
    const store = await tenantPrisma.store.findFirst({
      where: { id: data.storeId, organization_id: data.organizationId },
      select: { id: true, name: true },
    });
    if (!store) throw new Error("Store not found in this organization");

    const ttlDays = Math.min(
      Math.max(data.expiresInDays ?? DEFAULT_INVITE_TTL_DAYS, 1),
      MAX_INVITE_TTL_DAYS
    );
    const token = crypto.randomBytes(32).toString("hex");
    const invite = await prisma.storeInvite.create({
      data: {
        organization_id: data.organizationId,
        store_id: store.id,
        token_hash: hashInviteToken(token),
        expires_at: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
        created_by: data.createdBy,
      },
    });

    logger.info("Store invite created", "inviteService", {
      inviteId: invite.id,
      organizationId: data.organizationId,
      storeId: store.id,
    });

    return {
      invite: { ...invite, store_name: store.name, status: "outstanding" },
      token,
    };
  }

  async listInvites(organizationId: string): Promise<InviteRecord[]> {
    const tenantPrisma = await getTenantPrisma(organizationId);
    const [invites, stores] = await Promise.all([
      prisma.storeInvite.findMany({
        where: { organization_id: organizationId },
        orderBy: { created_at: "desc" },
      }),
      tenantPrisma.store.findMany({
        where: { organization_id: organizationId },
        select: { id: true, name: true },
      }),
    ]);
    const names = new Map(stores.map((s) => [s.id, s.name]));
    return invites.map((invite) => ({
      ...invite,
      store_name: names.get(invite.store_id) ?? null,
      status: toStatus(invite),
    }));
  }

  async revokeInvite(data: {
    inviteId: string;
    organizationId: string;
  }): Promise<void> {
    const invite = await prisma.storeInvite.findFirst({
      where: { id: data.inviteId, organization_id: data.organizationId },
    });
    if (!invite) throw new Error("Invite not found");
    if (invite.used_at) throw new Error("Invite has already been used");
    if (invite.revoked_at) throw new Error("Invite has already been revoked");

    await prisma.storeInvite.update({
      where: { id: invite.id },
      data: { revoked_at: new Date() },
    });

    logger.info("Store invite revoked", "inviteService", {
      inviteId: invite.id,
    });
  }
}

export default new InviteService();
