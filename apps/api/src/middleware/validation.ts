import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export const validateRequest =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync(req.body);
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const issues = error.issues || [];
          const message = issues.map((e) => e.message).join(", ");
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };

export const validateParams =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync(req.params);
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const issues = error.issues || [];
          const message = issues.map((e) => e.message).join(", ");
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };

export const validateQuery =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync(req.query);
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const issues = error.issues || [];
          const message = issues.map((e) => e.message).join(", ");
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };

export const validate =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const issues = error.issues || [];
          const message = issues.map((e) => e.message).join(", ");
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };
