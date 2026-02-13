import { Request, Response, NextFunction } from "express";

/**
 * Simple XSS sanitization middleware
 * Sanitizes string inputs by removing potentially dangerous HTML/script tags
 */
const MAX_SANITIZE_DEPTH = 20;
const SAFE_DATA_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

function stripDangerousProtocols(input: string): string {
  let output = input;

  // Repeat a few times to collapse nested payloads like jjavascript:avascript:
  for (let i = 0; i < 5; i += 1) {
    const next = output.replace(/(?:javascript|vbscript)\s*:/gi, "");
    if (next === output) {
      break;
    }
    output = next;
  }

  return output;
}

function sanitizeValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (depth > MAX_SANITIZE_DEPTH) {
    return value;
  }

  if (typeof value === "string") {
    // Remove script tags and their content
    let sanitized = value.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );

    // Remove other dangerous tags that can execute scripts or alter DOM behavior.
    sanitized = sanitized.replace(
      /<\/?(?:iframe|object|embed|link|meta|base|form)\b[^>]*>/gi,
      ""
    );

    // Remove inline event handlers only when they appear in an HTML tag attribute context.
    sanitized = sanitized.replace(
      /(<[^>]*?)\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
      "$1"
    );

    // Remove dangerous script protocols, including nested payloads.
    sanitized = stripDangerousProtocols(sanitized);

    // Remove data: URIs except for explicitly whitelisted image MIME types.
    sanitized = sanitized.replace(
      /\bdata:([a-z0-9.+-]+\/[a-z0-9.+-]+)(?:;[^,\s"'<>]+)*(?:,[^"'\s<>]*)?/gi,
      (match, mimeType: string) =>
        SAFE_DATA_IMAGE_MIME_TYPES.has(mimeType.toLowerCase()) ? match : ""
    );

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return value;
    }
    seen.add(value);

    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, depth + 1, seen);
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
