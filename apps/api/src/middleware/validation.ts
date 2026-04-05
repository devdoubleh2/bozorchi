import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

const formatZodIssues = (issues: ZodError["issues"]) =>
  issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");

export const validateRequest =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync(req.body);
        // Apply coercions/stripping from schema back onto the request
        req.body = parsed as typeof req.body;
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const message = formatZodIssues(error.issues || []);
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };

export const validateParams =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync(req.params);
        req.params = parsed as typeof req.params;
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const message = formatZodIssues(error.issues || []);
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };

export const validateQuery =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync(req.query);
        req.query = parsed as typeof req.query;
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const message = formatZodIssues(error.issues || []);
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };

export const validate =
  (schema: ZodSchema) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        req.body = parsed.body as typeof req.body;
        req.query = parsed.query as typeof req.query;
        req.params = parsed.params as typeof req.params;
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const message = formatZodIssues(error.issues || []);
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };
