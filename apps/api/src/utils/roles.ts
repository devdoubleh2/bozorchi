import { Role } from "../generated/public/client";

/**
 * Public API role: exactly two jobs — owner and cashier.
 *
 * Storage and API agree (Role owner|cashier), so translation is a
 * pass-through kept at the persistence edge only because the ORM
 * requires the generated enum type.
 */
export type ApiRole = "owner" | "cashier";

/** Translate an API-facing role into the stored membership role. */
export const toStoredRole = (role: ApiRole): Role =>
  role === "owner" ? Role.owner : Role.cashier;

/** Translate a stored membership role into the API-facing role. */
export const toApiRole = (role: Role | string): ApiRole =>
  role === Role.owner || role === "owner" ? "owner" : "cashier";
