import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny, infer as zInfer } from "zod";
import { AppError } from "../utils/AppError";

const formatZodIssues = (issues: ZodError["issues"]) =>
  issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");

export const validateRequest =
  <T extends ZodTypeAny>(schema: T) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync(req.body);
        req.body = parsed as unknown as Request["body"];
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
  <T extends ZodTypeAny>(schema: T) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync(req.params);
        req.params = parsed as unknown as Request["params"];
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
  <T extends ZodTypeAny>(schema: T) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync(req.query);
        req.query = parsed as unknown as Request["query"];
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
  <T extends ZodTypeAny>(schema: T) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        const typed = parsed as zInfer<T> & {
          body?: unknown;
          query?: unknown;
          params?: unknown;
        };

        if ("body" in typed) req.body = typed.body as unknown as Request["body"];
        if ("query" in typed) req.query = typed.query as unknown as Request["query"];
        if ("params" in typed) req.params = typed.params as unknown as Request["params"];
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const message = formatZodIssues(error.issues || []);
          return next(new AppError(message, 400));
        }
        return next(error);
      }
    };
