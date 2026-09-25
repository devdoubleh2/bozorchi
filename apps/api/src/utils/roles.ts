import { Role } from "../generated/public/client";

/**
 * Public API role for the cashier job.
 *
 * Validators, API docs, shared types, and UI speak "cashier". The stored
 * membership value keeps the legacy "user" value (see GLOSSARY.md
 * exception); translation happens only through toStoredRole / toApiRole
 * at the persistence edge, never inline.
 */
export type ApiRole = "admin" | "cashier";

/** Translate an API-facing role into the stored membership role. */
export const toStoredRole = (role: ApiRole): Role =>
  role === "admin" ? Role.admin : Role.user;

/** Translate a stored membership role into the API-facing role. */
export const toApiRole = (role: Role | string): ApiRole =>
  role === Role.admin ? "admin" : "cashier";
