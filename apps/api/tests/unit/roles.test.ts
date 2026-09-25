import { describe, expect, it } from "bun:test";
import { Role } from "../../src/generated/public/client";
import { toApiRole, toStoredRole } from "../../src/utils/roles";

describe("cashier role mapping at the persistence edge", () => {
  it("stores the cashier job under the legacy user value", () => {
    expect(toStoredRole("cashier")).toBe(Role.user);
    expect(toStoredRole("cashier")).toBe("user");
  });

  it("stores admins unchanged", () => {
    expect(toStoredRole("admin")).toBe(Role.admin);
  });

  it("presents the stored user value as cashier above the edge", () => {
    expect(toApiRole(Role.user)).toBe("cashier");
    expect(toApiRole("user")).toBe("cashier");
  });

  it("presents the stored admin value as admin above the edge", () => {
    expect(toApiRole(Role.admin)).toBe("admin");
  });

  it("round-trips the cashier job", () => {
    expect(toApiRole(toStoredRole("cashier"))).toBe("cashier");
  });
});
