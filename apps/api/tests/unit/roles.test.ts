import { describe, expect, it } from "bun:test";
import { Role } from "../../src/generated/public/client";
import { toApiRole, toStoredRole } from "../../src/utils/roles";

describe("owner/cashier role mapping at the persistence edge", () => {
  it("stores the cashier job as cashier", () => {
    expect(toStoredRole("cashier")).toBe(Role.cashier);
    expect(toStoredRole("cashier")).toBe("cashier");
  });

  it("stores owners as owner", () => {
    expect(toStoredRole("owner")).toBe(Role.owner);
  });

  it("presents the stored cashier value as cashier above the edge", () => {
    expect(toApiRole(Role.cashier)).toBe("cashier");
    expect(toApiRole("cashier")).toBe("cashier");
  });

  it("presents the stored owner value as owner above the edge", () => {
    expect(toApiRole(Role.owner)).toBe("owner");
  });

  it("round-trips both jobs", () => {
    expect(toApiRole(toStoredRole("cashier"))).toBe("cashier");
    expect(toApiRole(toStoredRole("owner"))).toBe("owner");
  });
});
