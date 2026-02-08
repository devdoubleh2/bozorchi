import { Response } from "express";
import { Prisma } from "../generated/tenant/client";
import { AuthRequest } from "@/middleware/auth";

export class CustomersController {
  // Get all customers for a store
  async getCustomers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: "Store context is required" });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const customers = await req.tenantPrisma.customer.findMany({
        where: {
          store_id: req.store.id,
        },
        include: {
          loyalty_card: true,
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      res.json({ customers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  }

  // Get a single customer by ID
  async getCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.store || !id) {
        res.status(400).json({ error: "Store and customer ID are required" });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const customer = await req.tenantPrisma.customer.findFirst({
        where: {
          id,
          store_id: req.store.id,
        },
        include: {
          loyalty_card: true,
          transactions: {
            orderBy: {
              created_at: "desc",
            },
            take: 50,
            include: {
              product_variation: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      // Calculate total debt
      const debtAggregations = await req.tenantPrisma.transaction.groupBy({
        by: ["transaction_type"],
        where: {
          customer_id: id,
          store_id: req.store.id,
          transaction_type: {
            in: ["debt", "repayment"],
          },
        },
        _sum: {
          total_amount: true,
        },
      });

      const totalDebt = debtAggregations.reduce(
        (acc: Prisma.Decimal, curr: (typeof debtAggregations)[number]) => {
          if (curr.transaction_type === "debt") {
            return acc.plus(curr._sum.total_amount || new Prisma.Decimal(0));
          } else if (curr.transaction_type === "repayment") {
            return acc.minus(curr._sum.total_amount || new Prisma.Decimal(0));
          }
          return acc;
        },
        new Prisma.Decimal(0)
      );

      res.json({ customer: { ...customer, total_debt: totalDebt } });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  }

  // Create a new customer
  async createCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        phone,
        language,
        gender,
        social_links,
        date_of_birth,
      } = req.body;

      if (!req.store || !name) {
        res.status(400).json({
          error: "Store and name are required",
        });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const customer = await req.tenantPrisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const createdCustomer = await tx.customer.create({
            data: {
              name,
              email: email || null,
              phone: phone || null,
              language: language || "uz",
              gender: gender || null,
              date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
              social_links: social_links || null,
              store_id: req.store!.id,
              organization_id: req.store!.organization_id,
            },
          });

          const identifier =
            (phone && phone.trim()) ||
            (email && email.trim()) ||
            `CARD-${createdCustomer.id}`;

          await tx.loyaltyCard.upsert({
            where: { customer_id: createdCustomer.id },
            update: {},
            create: {
              customer_id: createdCustomer.id,
              card_number: identifier,
              points: 0,
            },
          });

          return tx.customer.findUnique({
            where: { id: createdCustomer.id },
            include: { loyalty_card: true },
          });
        }
      );

      res.status(201).json({ customer });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  }

  // Update a customer
  async updateCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phone,
        language,
        gender,
        social_links,
        date_of_birth,
      } = req.body;

      if (!req.store || !id) {
        res.status(400).json({ error: "Store and customer ID are required" });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const customer = await req.tenantPrisma.customer.findFirst({
        where: {
          id,
          store_id: req.store.id,
        },
      });

      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }

      const updatedCustomer = await req.tenantPrisma.customer.update({
        where: { id: id as string },
        data: {
          name: name || customer.name,
          email: email !== undefined ? email : customer.email,
          phone: phone !== undefined ? phone : customer.phone,
          language: language !== undefined ? language : customer.language,
          gender: gender !== undefined ? gender : customer.gender,
          date_of_birth:
            date_of_birth !== undefined
              ? date_of_birth
                ? new Date(date_of_birth)
                : null
              : customer.date_of_birth,
          social_links:
            social_links !== undefined ? social_links : customer.social_links,
        },
        include: {
          loyalty_card: true,
        },
      });

      res.json({ customer: updatedCustomer });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  }

  // Delete a customer
  async deleteCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.store || !id) {
        res.status(400).json({ error: "Store and customer ID are required" });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const customer = await req.tenantPrisma.customer.findFirst({
        where: {
          id,
          store_id: req.store.id,
        },
      });

      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }

      // Delete loyalty card first if exists
      await req.tenantPrisma.loyaltyCard.deleteMany({
        where: { customer_id: id as string },
      });

      // Delete customer
      await req.tenantPrisma.customer.delete({
        where: { id: id as string },
      });

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  }

  // Create or update loyalty card
  async createLoyaltyCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customer_id, card_number, points } = req.body;

      if (!req.store || !customer_id || !card_number) {
        res.status(400).json({
          error: "Store, customer ID and card number are required",
        });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      // Check if customer exists
      const customer = await req.tenantPrisma.customer.findFirst({
        where: { id: customer_id, store_id: req.store.id },
      });

      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }

      // Check if loyalty card already exists
      const existingCard = await req.tenantPrisma.loyaltyCard.findUnique({
        where: { customer_id },
      });

      let loyaltyCard;
      if (existingCard) {
        // Update existing card
        loyaltyCard = await req.tenantPrisma.loyaltyCard.update({
          where: { customer_id },
          data: {
            card_number,
            points: points || existingCard.points,
          },
        });
      } else {
        // Create new card
        loyaltyCard = await req.tenantPrisma.loyaltyCard.create({
          data: {
            customer_id,
            card_number,
            points: points || 0,
          },
        });
      }

      res.json({ loyalty_card: loyaltyCard });
    } catch (error) {
      console.error("Error creating/updating loyalty card:", error);
      res.status(500).json({ error: "Failed to create/update loyalty card" });
    }
  }

  // Update loyalty card points
  async updateLoyaltyPoints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customer_id } = req.params;
      const { points, operation = "add" } = req.body;

      if (!req.store || !customer_id || !points || points <= 0) {
        res.status(400).json({
          error: "Store, customer ID and positive points amount are required",
        });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const loyaltyCard = await req.tenantPrisma.loyaltyCard.findFirst({
        where: { customer_id, customer: { store_id: req.store.id } },
      });

      if (!loyaltyCard) {
        res.status(404).json({ error: "Loyalty card not found" });
        return;
      }

      const newPoints =
        operation === "add"
          ? loyaltyCard.points + points
          : Math.max(0, loyaltyCard.points - points);

      const updatedCard = await req.tenantPrisma.loyaltyCard.update({
        where: { customer_id },
        data: { points: newPoints },
      });

      res.json({ loyalty_card: updatedCard });
    } catch (error) {
      console.error("Error updating loyalty points:", error);
      res.status(500).json({ error: "Failed to update loyalty points" });
    }
  }

  // Delete loyalty card
  async deleteLoyaltyCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customer_id } = req.params;

      if (!req.store || !customer_id) {
        res.status(400).json({ error: "Store and customer ID are required" });
        return;
      }

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const loyaltyCard = await req.tenantPrisma.loyaltyCard.findFirst({
        where: { customer_id, customer: { store_id: req.store.id } },
      });

      if (!loyaltyCard) {
        res.status(404).json({ error: "Loyalty card not found" });
        return;
      }

      await req.tenantPrisma.loyaltyCard.delete({
        where: { customer_id },
      });

      res.json({ message: "Loyalty card deleted successfully" });
    } catch (error) {
      console.error("Error deleting loyalty card:", error);
      res.status(500).json({ error: "Failed to delete loyalty card" });
    }
  }
}
