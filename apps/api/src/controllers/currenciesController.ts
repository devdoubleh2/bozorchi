import { Response } from "express";
import logger from "../../logs/log";
import { AuthRequest } from "@/middleware/auth";
import * as currenciesService from "../services/currencies";

export class CurrenciesController {
    async getAllCurrencies(req: AuthRequest, res: Response): Promise<Response> {
        try {
            if (!req.organization) {
                return res.status(400).json({ error: "Organization context required" });
            }

            if (!req.tenantPrisma) {
                return res.status(404).json({ error: "No tenant prisma found" });
            }

            if (!req.store) {
                return res.status(400).json({ error: "Store context required" });
            }

            const currencies = await currenciesService.getCurrencies(
                req.tenantPrisma,
                req.store.id
            );

            return res.json({ currencies });
        } catch (error) {
            logger.error("Get currencies error:", "currenciesController", error);
            return res.status(500).json({
                error: "Failed to get currencies",
                message: (error as Error).message,
            });
        }
    }

    async createCurrency(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { code, symbol, name, rate, is_base, is_active } = req.body;

            if (!code || !name) {
                return res.status(400).json({
                    error: "Currency code and name are required",
                });
            }

            if (!req.store) {
                return res.status(400).json({ error: "Store context required" });
            }

            if (!req.tenantPrisma) {
                return res.status(404).json({ error: "No tenant prisma found" });
            }

            const currency = await currenciesService.createCurrency(
                req.tenantPrisma,
                req.store.id,
                {
                    code,
                    symbol,
                    name,
                    rate: Number(rate),
                    is_base,
                    is_active,
                }
            );

            return res.status(201).json({
                message: "Currency created successfully",
                currency,
            });
        } catch (error) {
            logger.error("Create currency error:", "currenciesController", error);
            return res.status(500).json({
                error: "Failed to create currency",
                message: (error as Error).message,
            });
        }
    }

    async updateCurrency(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { code, symbol, name, rate, is_base, is_active } = req.body;

            if (!req.store) {
                return res.status(400).json({ error: "Store context required" });
            }

            if (!req.tenantPrisma) {
                return res.status(404).json({ error: "No tenant prisma found" });
            }

            const currency = await currenciesService.updateCurrency(
                req.tenantPrisma,
                req.store.id,
                id!,
                {
                    code,
                    symbol,
                    name,
                    rate: rate !== undefined ? Number(rate) : undefined,
                    is_base,
                    is_active,
                }
            );

            return res.json({
                message: "Currency updated successfully",
                currency,
            });
        } catch (error) {
            logger.error("Update currency error:", "currenciesController", error);
            return res.status(500).json({
                error: "Failed to update currency",
                message: (error as Error).message,
            });
        }
    }

    async deleteCurrency(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            if (!req.store) {
                return res.status(400).json({ error: "Store context required" });
            }

            if (!req.tenantPrisma) {
                return res.status(404).json({ error: "No tenant prisma found" });
            }

            await currenciesService.deleteCurrency(
                req.tenantPrisma,
                req.store.id,
                id!
            );

            return res.json({
                message: "Currency deleted successfully",
            });
        } catch (error) {
            logger.error("Delete currency error:", "currenciesController", error);
            return res.status(500).json({
                error: "Failed to delete currency",
                message: (error as Error).message,
            });
        }
    }
}
