import { Response } from "express";
import logger from "../../logs/log";
import { AuthRequest, isOwner } from "../middleware/auth";
import { createTenantSchema, getTenantPrisma, prisma } from "../lib/prisma";

export class StoresController {
  async getStores(req: AuthRequest, res: Response) {
    logger.info("Get stores attempt", "storesController", {
      userId: req.userId,
      organizationId: req.organizationId,
      page: req.query["page"],
      limit: req.query["limit"],
    });

    try {
      const page = Number(req.query["page"]) || 1;
      const limit = Number(req.query["limit"]) || 10;
      const skip = (page - 1) * limit;

      // Use stores pre-fetched by auth middleware
      const allStores = req.userStores || [];

      // Sort by created_at desc
      allStores.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const stores = allStores.slice(skip, skip + limit);
      const total = allStores.length;

      logger.info("Stores retrieved successfully", "storesController", {
        userId: req.userId,
        total,
        page,
        returned: stores.length,
      });

      return res.json({
        stores,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error("Get stores error:", "storesController", error);
      return res.status(500).json({
        error: "Failed to fetch stores",
        message: (error as Error).message,
      });
    }
  }

  async createStore(req: AuthRequest, res: Response) {
    const { name, currency, address, phone, loyalty_cashback_percentage } =
      req.body;

    logger.info("Create store attempt", "storesController", {
      userId: req.userId,
      organizationId: req.organizationId,
      storeName: name,
      role: req.userRole,
    });

    try {
      if (!req.userId) {
        logger.warn("Create store failed - no organization context", "storesController", {
          userId: req.userId,
          hasOrganization: !!req.organization,
        });
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      // SECURITY: Only owners can create stores
      if (!isOwner(req.user)) {
        logger.warn("Create store failed - insufficient permissions", "storesController", {
          userId: req.userId,
          role: req.userRole,
          organizationId: req.organizationId,
        });
        return res.status(403).json({
          error: "Insufficient permissions",
          details: "Only organization owners can create stores",
        });
      }

      // Validate required fields
      if (!name || !address || !phone) {
        logger.warn("Create store failed - missing required fields", "storesController", {
          userId: req.userId,
          hasName: !!name,
          hasAddress: !!address,
          hasPhone: !!phone,
        });
        return res.status(400).json({
          error: "Missing required fields",
          details: "name, address, and phone are required",
        });
      }

      let organizationId = req.organizationId;
      let tenantPrisma = req.tenantPrisma;

      if (!organizationId) {
        const slugBase = (name as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        const slug = `${slugBase || "store"}-${Math.floor(Math.random() * 10000)}`;

        const organization = await prisma.organization.create({
          data: {
            name,
            slug,
            owner: { connect: { id: req.userId } },
          },
        });

        await createTenantSchema(organization.id);
        tenantPrisma = await getTenantPrisma(organization.id, true);
        organizationId = organization.id;

        logger.info("Organization created during first store onboarding", "storesController", {
          userId: req.userId,
          organizationId,
        });
      }

      if (!tenantPrisma || !organizationId) {
        logger.error("Create store failed - tenant database not initialized", "storesController", {
          userId: req.userId,
          organizationId,
        });
        return res.status(500).json({
          error: "Tenant database not initialized",
        });
      }

      // Create the store in the tenant schema
      const store = await tenantPrisma.store.create({
        data: {
          organization_id: organizationId,
          name,
          address,
          currency: currency || "UZS",
          phone,
          loyalty_cashback_percentage: loyalty_cashback_percentage || 0,
        },
      });

      logger.info("Store created successfully", "storesController", {
        storeId: store.id,
        storeName: store.name,
        organizationId,
        userId: req.userId,
      });

      const existingMembership = await prisma.userOrganization.findUnique({
        where: { user_id: req.userId },
      });

      if (!existingMembership) {
        await prisma.userOrganization.create({
          data: {
            user_id: req.userId,
            organization_id: organizationId,
            store_id: store.id,
            role: "owner",
            approved: true,
          },
        });
      }

      return res.status(201).json({
        store,
        message: "Store created successfully",
      });
    } catch (error) {
      logger.error("Create store error:", "storesController", {
        error: (error as Error).message,
        userId: req.userId,
        organizationId: req.organizationId,
        storeName: name,
      });
      return res.status(500).json({
        error: "Failed to create store",
        message: (error as Error).message,
      });
    }
  }

  async getStore(req: AuthRequest, res: Response) {
    logger.info("Get current store attempt", "storesController", {
      userId: req.userId,
      storeId: req.store?.id,
    });

    try {
      // If store already resolved by middleware, use it
      if (req.store) {
        logger.info("Store retrieved successfully (from middleware)", "storeController", {
          userId: req.userId,
          storeId: req.store.id,
          storeName: req.store.name,
        });
        return res.json({ data: req.store });
      }

      // Otherwise, resolve store manually (when requireStore: false in middleware)
      // Same logic as auth middleware store resolution
      const isOwnerLink = isOwner(req.user);
      let store = null;

      logger.debug("Resolving store manually", "storesController", {
        userId: req.userId,
        isOwnerLink,
        userStoresCount: req.userStores?.length || 0,
        membershipStoreId: req.user?.membership?.store_id,
      });

      if (isOwnerLink) {
        // Use first available store for owners
        store = req.userStores?.[0] || null;
      } else {
        // Use assigned store for cashiers
        const storeId = req.user?.membership?.store_id;
        if (storeId && req.tenantPrisma) {
          store = await req.tenantPrisma.store.findUnique({
            where: { id: storeId }
          });
        }
      }

      if (!store) {
        logger.warn("Get store failed - no active store found", "storesController", {
          userId: req.userId,
          organizationId: req.organizationId,
          isOwnerLink,
        });
        return res.status(404).json({
          error: "No active store found",
        });
      }

      logger.info("Store retrieved successfully (resolved manually)", "storesController", {
        userId: req.userId,
        storeId: store.id,
        storeName: store.name,
      });

      return res.json({ data: store });
    } catch (error) {
      logger.error("Get store error:", "storesController", {
        error: (error as Error).message,
        userId: req.userId,
      });
      return res.status(500).json({
        error: "Failed to fetch store",
        message: (error as Error).message,
      });
    }
  }

  async getStoreById(req: AuthRequest, res: Response) {
    const storeId = req.params["id"];

    logger.info("Store switch attempt", "storesController", {
      userId: req.userId,
      targetStoreId: storeId,
      currentStoreId: req.store?.id,
      role: req.userRole,
      isOwner: !!req.user?.owned_organization,
    });

    try {
      // Only organization owners can switch stores
      if (!isOwner(req.user)) {
        logger.warn("Store switch failed - insufficient permissions", "storesController", {
          userId: req.userId,
          targetStoreId: storeId,
          role: req.userRole,
          isOwner: !!req.user?.owned_organization,
        });
        return res.status(403).json({
          error: "Only organization owners can switch stores",
        });
      }

      if (!storeId) {
        logger.warn("Store switch failed - no store ID provided", "storesController", {
          userId: req.userId,
        });
        return res.status(400).json({ error: "Store ID is required" });
      }

      if (!req.tenantPrisma) {
        logger.error("Store switch failed - tenant database not initialized", "storesController", {
          userId: req.userId,
          storeId,
        });
        return res.status(500).json({
          error: "Tenant database not initialized",
        });
      }

      const store = await req.tenantPrisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        logger.warn("Store switch failed - store not found", "storesController", {
          userId: req.userId,
          storeId,
        });
        return res.status(404).json({ error: "Store not found" });
      }

      logger.info("Store switch successful", "storesController", {
        userId: req.userId,
        storeId: store.id,
        storeName: store.name,
        previousStoreId: req.store?.id,
      });

      return res.json({ data: store });
    } catch (error) {
      logger.error("Store switch error:", "storesController", {
        error: (error as Error).message,
        userId: req.userId,
        storeId,
      });
      return res.status(500).json({
        error: "Failed to fetch store",
        message: (error as Error).message,
      });
    }
  }

  async getStoresByOrganizationId(req: AuthRequest, res: Response) {
    logger.info("Get stores by organization attempt", "storesController", {
      userId: req.userId,
      organizationId: req.organizationId,
    });

    try {
      const organizationId = req.organizationId;
      if (!organizationId) {
        logger.warn("Get stores by organization failed - no organization ID", "storesController", {
          userId: req.userId,
        });
        return res.status(400).json({ error: "Organization ID is required" });
      }

      if (!req.tenantPrisma) {
        logger.error(
          "Get stores by organization failed - tenant database not initialized", "storeController",
          {
            userId: req.userId,
            organizationId,
          }
        );
        return res.status(500).json({
          error: "Tenant database not initialized",
        });
      }

      const stores = await req.tenantPrisma.store.findMany({
        where: { organization_id: organizationId },
      });

      logger.info("Stores by organization retrieved successfully", "storesController", {
        userId: req.userId,
        organizationId,
        storeCount: stores.length,
      });

      return res.json({ data: stores });
    } catch (error) {
      logger.error("Get stores by organization ID error:", "storesController", {
        error: (error as Error).message,
        userId: req.userId,
        organizationId: req.organizationId,
      });
      return res.status(500).json({
        error: "Failed to fetch stores",
        message: (error as Error).message,
      });
    }
  }

  /**
   * Switch store for owners.
   * Returns a new JWT token with the activeStoreId embedded.
   * This is session-based - no database update.
   */
  async switchStore(req: AuthRequest, res: Response) {
    const { storeId } = req.body;

    logger.info("Store switch attempt (session-based)", "storesController", {
      userId: req.userId,
      targetStoreId: storeId,
      currentStoreId: req.store?.id,
      role: req.userRole,
      isOwner: !!req.user?.owned_organization,
    });

    try {
      // Only organization owners can switch stores
      if (!isOwner(req.user)) {
        logger.warn("Store switch failed - insufficient permissions", "storesController", {
          userId: req.userId,
          targetStoreId: storeId,
          role: req.userRole,
          isOwner: !!req.user?.owned_organization,
        });
        return res.status(403).json({
          error: "Only organization owners can switch stores",
        });
      }

      if (!storeId) {
        return res.status(400).json({ error: "Store ID is required" });
      }

      if (!req.tenantPrisma || !req.organizationId) {
        return res.status(500).json({
          error: "Tenant database not initialized",
        });
      }

      // Verify store exists and belongs to this organization
      const store = await req.tenantPrisma.store.findUnique({
        where: {
          id: storeId,
          organization_id: req.organizationId,
        },
      });

      if (!store) {
        logger.warn("Store switch failed - store not found", "storesController", {
          userId: req.userId,
          storeId,
          organizationId: req.organizationId,
        });
        return res.status(404).json({ error: "Store not found" });
      }

      // Import auth service to generate new token
      const authService = (await import("../services/auth")).default;

      // Generate new token with activeStoreId embedded
      const newToken = authService.generateToken(
        req.userId,
        req.organizationId,
        storeId
      );

      logger.info("Store switch successful (session-based)", "storesController", {
        userId: req.userId,
        storeId: store.id,
        storeName: store.name,
        previousStoreId: req.store?.id,
      });

      // Set new token in HttpOnly cookie
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });


      return res.json({

        store,
        message: "Store switched successfully",
      });
    } catch (error) {
      logger.error("Store switch error:", "storesController", {
        error: (error as Error).message,
        userId: req.userId,
        storeId,
      });
      return res.status(500).json({
        error: "Failed to switch store",
        message: (error as Error).message,
      });
    }
  }

  async updateStore(req: AuthRequest, res: Response) {
    const storeId = req.store?.id;

    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    // Only organization owners can update stores
    if (!isOwner(req.user)) {
      return res.status(403).json({
        error: "Only organization owners can update stores",
      });
    }

    if (!req.tenantPrisma) {
      return res.status(500).json({
        error: "Tenant database not initialized",
      });
    }

    try {
      const existingStore = await req.tenantPrisma.store.findUnique({
        where: { id: storeId },
      });

      if (!existingStore) {
        return res.status(404).json({ error: "Store not found" });
      }

      const {
        name,
        currency,
        loyalty_cashback_percentage,
        address,
        phone,
      } = req.body;

      const updatedStore = await req.tenantPrisma.store.update({
        where: { id: storeId },
        data: {
          ...(name !== undefined && { name }),
          ...(currency !== undefined && { currency }),
          ...(loyalty_cashback_percentage !== undefined && {
            loyalty_cashback_percentage: Number(loyalty_cashback_percentage),
          }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
        },
      });

      logger.info("Store updated successfully", "storesController", {
        userId: req.userId,
        storeId: updatedStore.id,
        storeName: updatedStore.name,
      });

      return res.json({ data: updatedStore });
    } catch (error) {
      logger.error("Store update error:", "storesController", {
        error: (error as Error).message,
        userId: req.userId,
        storeId,
      });
      return res.status(500).json({
        error: "Failed to update store",
        message: (error as Error).message,
      });
    }
  }

  async deleteStore(_req: AuthRequest, res: Response) {
    // Implementation would go here
    return res.status(501).json({ error: "Not implemented" });
  }

  async searchStores(_req: AuthRequest, res: Response) {
    // Implementation would go here
    return res.status(501).json({ error: "Not implemented" });
  }

  async getStoreStats(_req: AuthRequest, res: Response) {
    // Implementation would go here
    return res.status(501).json({ error: "Not implemented" });
  }

  async getSubscriptionHistory(_req: AuthRequest, res: Response) {
    // Implementation would go here
    return res.status(501).json({ error: "Not implemented" });
  }
}
