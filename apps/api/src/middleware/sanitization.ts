import { Request, Response, NextFunction } from "express";

/**
 * Simple XSS sanitization middleware
 * Sanitizes string inputs by removing potentially dangerous HTML/script tags
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    // Remove script tags and their content
    let sanitized = value.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );

    // Remove dangerous HTML event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, "");

    // Remove data: URIs (except images)
    sanitized = sanitized.replace(
      /data:(?!image\/)[^;,]+;base64,[^"'\s]*/gi,
      ""
    );

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }

  next();
};