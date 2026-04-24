import { Response } from "express";

interface SuccessResponse<T> {
  status: "success";
  data: T;
  meta?: Record<string, unknown>;
}

interface FailResponse {
  status: "fail";
  message: string;
  errors?: Array<{ path: string; message: string }>;
}

interface ErrorResponse {
  status: "error";
  message: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: Record<string, unknown>
): Response {
  const response: SuccessResponse<T> = { status: "success", data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendFail(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Array<{ path: string; message: string }>
): Response {
  const response: FailResponse = { status: "fail", message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string = "Internal server error",
  statusCode: number = 500
): Response {
  const response: ErrorResponse = { status: "error", message };
  return res.status(statusCode).json(response);
}
