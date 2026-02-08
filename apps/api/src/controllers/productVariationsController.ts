import { Response } from "express";
import { AuthRequest } from "../middleware/auth";

export class ProductVariationsController {
    async getProductVariation(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: "Product variation ID is required" });
            }

            if (!req.tenantPrisma) {
                return res.status(404).json({ error: "Tenant not found" });
            }

            if (!req.store) {
                return res.status(400).json({ error: "Store context is required" });
            }

            const variation = await req.tenantPrisma.productVariation.findUnique({
                where: { id },
                include: {
                    product: {
                        select: {
                            name: true,
                            image_url: true,
                        },
                    },
                    unit: {
                        select: {
                            name: true,
                        },
                    },
                    inventory: {
                        where: {
                            store_id: req.store.id,
                        },
                        select: {
                            quantity_in_stock: true,
                        },
                    },
                },
            });

            if (!variation) {
                return res.status(404).json({ error: "Product variation not found" });
            }

            // Flatten the inventory data to match the expected frontend structure
            const inventoryItem = variation.inventory[0];
            const response = {
                ...variation,
                quantity_in_stock: inventoryItem?.quantity_in_stock ?? 0,
                inventory: undefined, // Remove the nested inventory array
            };

            return res.json(response);
        } catch (error) {
            console.error("Error fetching product variation:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}
