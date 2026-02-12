/**
 * Authentication Service
 *
 * Handles user registration, login, token management, and password operations.
 * Single source of truth for all authentication logic.
 */

import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma, getTenantPrisma, createTenantSchema } from "../lib/prisma";
import { AuthRequest } from "@/middleware/auth";
import { Prisma } from "../generated/public/client";
import logger from "../../logs/log";

interface AccessTokenPayload {
  userId: string;
  organizationId?: string;
  activeStoreId?: string; // For owners/admins switching stores (session-based)
  iat?: number;
  exp?: number;
}



interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  organization_name?: string;
  store_name?: string;
  address?: string;
  phone?: string;
  currency?: string;
  organization_id?: string;
  store_id?: string;
}

interface LoginData {
  email: string;
  password: string;
}

/** User data returned from auth operations (password_hash excluded) */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
  push_token?: string | null;
  membership?: {
    id: string;
    user_id: string;
    organization_id: string;
    role: string;
    created_at: Date;
    updated_at: Date;
    organization: Record<string, unknown>;
  } | null;
  owned_organization?: ({ id: string } & Record<string, unknown>) | null;
}

interface AuthResult {
  user: AuthUser;
  token: string;
}

class AuthService {
  private readonly JWT_SECRET: string;

  private readonly JWT_REFRESH_EXPIRES_IN: string;
  private readonly SALT_ROUNDS = 12;

  constructor() {
    const secret = process.env["JWT_SECRET"];
    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters");
    }
    this.JWT_SECRET = secret;
    this.JWT_REFRESH_EXPIRES_IN =
      process.env["JWT_REFRESH_EXPIRES_IN"] || "30d";
  }

  /**
   * Generate a single JWT token containing all auth context.
   * This token will be stored in an HttpOnly cookie.
   */
  generateToken(
    userId: string,
    organizationId?: string,
    storeId?: string
  ): string {
    const payload: AccessTokenPayload = {
      userId,
      organizationId,
      activeStoreId: storeId
    };
    const options: SignOptions = {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"], // Use longer expiry (30d)
    };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  verifyToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as AccessTokenPayload;
      if (!decoded.userId) throw new Error("Invalid token payload");
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError)
        throw new Error("Token expired");
      if (error instanceof jwt.JsonWebTokenError)
        throw new Error("Invalid token");
      throw new Error("Token verification failed");
    }
  }

  async register(data: RegisterData): Promise<AuthResult | null> {
    const {
      name,
      email,
      password,
      role,
      organization_name,
      store_name,
      address,
      phone,
      currency,
      store_id,
    } = data;

    logger.info("Registration attempt", "authService", { email, role });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("User with this email already exists");

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: { name, email, password_hash: passwordHash },
        });

        if (role === "admin") {
          if (
            !organization_name ||
            !store_name ||
            !address ||
            !currency ||
            !phone
          ) {
            throw new Error(
              "Admin registration requires organization_name, store_name, address, currency, and phone"
            );
          }

          const slug = `${name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-${Math.floor(Math.random() * 10000)}`;

          const organization = await tx.organization.create({
            data: {
              name: organization_name,
              slug,
              owner: { connect: { id: user.id } },
            },
          });

          await createTenantSchema(organization.id);
          const tenantPrisma = await getTenantPrisma(organization.id, true);

          const store = await tenantPrisma.store.create({
            data: {
              organization_id: organization.id,
              name: store_name,
              address,
              currency,
              phone,
            },
          });

          await tx.userOrganization.create({
            data: {
              user_id: user.id,
              organization_id: organization.id,
              store_id: store.id,
              approved: true,
            },
            select: { id: true },
          });

          const userWithRelations = await tx.user.findUnique({
            where: { id: user.id },
            include: { owned_organization: true },
          });

          if (!userWithRelations)
            throw new Error("Failed to fetch created user");

          const { password_hash: _, ...authUser } = userWithRelations;
          return {
            user: authUser as AuthUser,
            token: this.generateToken(user.id, organization.id, store.id),
          };
        }

        // User role registration
        if (!store_id)
          throw new Error("Store ID is required for user registration");

        const existingStoreOrg = await tx.userOrganization.findFirst({
          where: { store_id },
          select: { organization_id: true },
        });

        if (!existingStoreOrg)
          throw new Error("Store not found or invalid store ID");

        await tx.userOrganization.create({
          data: {
            user_id: user.id,
            organization_id: existingStoreOrg.organization_id,
            store_id,
            role: "user",
            approved: true,
          },
          select: { id: true },
        });

        const userWithRelations = await tx.user.findUnique({
          where: { id: user.id },
          include: { owned_organization: true },
        });

        if (!userWithRelations) throw new Error("Failed to fetch created user");

        const { password_hash: _, ...authUser } = userWithRelations;
        return {
          user: authUser as AuthUser,
          token: this.generateToken(user.id, existingStoreOrg.organization_id, store_id),
        };
      },
      { maxWait: 10000, timeout: 120000 }
    );
  }

  async login(data: LoginData): Promise<AuthResult> {
    const { email, password } = data;
    logger.info("Login attempt", "authService", { email });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { owned_organization: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new Error("Invalid credentials");
    }

    const organizationId = user.owned_organization?.id;

    // Fetch membership to include role information
    const membership = await prisma.userOrganization.findUnique({
      where: { user_id: user.id },
      select: {
        id: true,
        user_id: true,
        organization_id: true,
        store_id: true,
        role: true,
        permissions: true,
        approved: true,
        organization: true,
      },
    });

    const { password_hash: _, ...authUser } = user;

    return {
      user: { ...authUser, membership } as AuthUser,
      token: this.generateToken(user.id, organizationId, membership?.store_id || undefined),
    };
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { owned_organization: true },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new Error("Current password is incorrect");

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: await bcrypt.hash(newPassword, this.SALT_ROUNDS) },
    });

    logger.info("Password changed", "authService", { userId });
    return true;
  }

  async updateProfile(data: {
    userId: string;
    email: string;
    name?: string | null;
    storeId?: string;
    organizationId?: string;
  }) {
    const { userId, email, name, storeId, organizationId } = data;

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId)
        throw new Error("Email is already taken");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { email },
    });

    if (name && storeId && organizationId) {
      const tenantPrisma = await getTenantPrisma(organizationId);
      await tenantPrisma.store.update({
        where: { id: storeId },
        data: { name },
      });
    }

    const { password_hash: _, ...result } = updated;
    return result;
  }

  async deleteUser(req: AuthRequest): Promise<void> {
    if (!req.tenantPrisma || !req.organization?.id) {
      throw new Error("Tenant prisma or organization not found");
    }

    const tenant = req.tenantPrisma;
    const orgId = req.organization.id;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const stores = await tenant.store.findMany({
        where: { organization_id: orgId },
      });

      for (const store of stores) {
        await tenant.transaction.deleteMany({ where: { store_id: store.id } });
        await tenant.inventory.deleteMany({ where: { store_id: store.id } });

        const customers = await tenant.customer.findMany({
          where: { store_id: store.id },
          select: { id: true },
        });
        await tenant.loyaltyCard.deleteMany({
          where: { customer_id: { in: customers.map((c) => c.id) } },
        });
        await tenant.customer.deleteMany({ where: { store_id: store.id } });
        await tenant.productVariation.deleteMany({
          where: { store_id: store.id },
        });
        await tenant.product.deleteMany({ where: { store_id: store.id } });
        await tenant.unit.deleteMany({ where: { store_id: store.id } });
        await tenant.productCategory.deleteMany({
          where: { store_id: store.id },
        });
        await tx.userOrganization.deleteMany({ where: { store_id: store.id } });
        await tenant.store.delete({ where: { id: store.id } });
      }

      await tx.userOrganization.deleteMany({ where: { user_id: req.userId } });
      await tx.user.delete({ where: { id: req.userId } });
    });

    logger.info("User deleted", "authService", { userId: req.userId });
  }

  async requestPasswordReset(email: string): Promise<{ token: string } | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null; // Silent fail to prevent email enumeration

    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.passwordResetToken.deleteMany({ where: { user_id: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        token_hash: tokenHash,
        user_id: user.id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    logger.info("Password reset token created", "authService", { userId: user.id });
    return { token };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const crypto = await import("crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.expires_at < new Date() ||
      resetToken.used_at ||
      !resetToken.user
    ) {
      throw new Error("Invalid or expired reset token");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user_id },
        data: {
          password_hash: await bcrypt.hash(newPassword, this.SALT_ROUNDS),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { user_id: resetToken.user_id, id: { not: resetToken.id } },
      }),
    ]);

    logger.info("Password reset completed", "authService", { userId: resetToken.user_id });
    return true;
  }
}

export default new AuthService();
