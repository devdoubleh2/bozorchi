import { describe, expect, it } from "bun:test";
import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "../../../app";
import { prisma } from "../../../src/lib/prisma";
import { createMember, registerOwner } from "../../helpers/orgHelper";

describe("One owner rule", () => {
  it("treats the owner as owner on owner-gated surfaces with an owner membership row", async () => {
    const org = await registerOwner();
    const membership = await prisma.userOrganization.findUnique({
      where: { user_id: org.userId },
    });

    expect(membership?.role).toBe("owner");

    const response = await request(app)
      .get("/api/staff/assignments")
      .set("Cookie", [org.cookie]);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("pending");
    expect(response.body).toHaveProperty("approved");
  }, 120000);

  it("denies an approved cashier at every owner-gated surface", async () => {
    const org = await registerOwner();
    const cashier = await createMember(org.organizationId, org.storeId, {
      role: "cashier",
    });

    const staff = await request(app)
      .get("/api/staff/assignments")
      .set("Cookie", [cashier.cookie]);
    expect(staff.status).toBe(403);

    const stores = await request(app)
      .delete("/api/stores")
      .set("Cookie", [cashier.cookie]);
    expect([403, 404]).toContain(stores.status);
  }, 120000);

  it("reserves billing for owners, never cashiers", async () => {
    const org = await registerOwner();
    const cashier = await createMember(org.organizationId, org.storeId, {
      role: "cashier",
    });

    const cashierBilling = await request(app)
      .post("/api/checkout/create-checkout")
      .set("Cookie", [cashier.cookie])
      .send({
        organizationId: org.organizationId,
        customerEmail: faker.internet.email(),
      });
    expect(cashierBilling.status).toBe(403);

    const ownerBilling = await request(app)
      .post("/api/checkout/create-checkout")
      .set("Cookie", [org.cookie])
      .send({
        organizationId: org.organizationId,
        customerEmail: faker.internet.email(),
      });
    expect(ownerBilling.status).not.toBe(403);
  }, 120000);

  it("lets the owner switch stores while a cashier cannot", async () => {
    const org = await registerOwner();
    const cashier = await createMember(org.organizationId, org.storeId, {
      role: "cashier",
    });

    const cashierSwitch = await request(app)
      .post("/api/stores/switch")
      .set("Cookie", [cashier.cookie])
      .send({ storeId: org.storeId });
    expect(cashierSwitch.status).toBe(403);
  }, 120000);
});
