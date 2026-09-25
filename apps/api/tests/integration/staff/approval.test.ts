import { describe, expect, it } from "bun:test";
import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "../../../app";
import { prisma } from "../../../src/lib/prisma";
import { extractTokenCookie } from "../../helpers/authHelper";
import { registerOwner } from "../../helpers/orgHelper";

async function setupPendingCashier() {
  const org = await registerOwner();
  const inviteRes = await request(app)
    .post("/api/staff/invites")
    .set("Cookie", [org.cookie])
    .send({ store_id: org.storeId });
  expect(inviteRes.status).toBe(201);

  const email = faker.internet.email();
  const password = "Password123!";
  const registerRes = await request(app).post("/api/auth/register").send({
    name: faker.person.fullName(),
    email,
    password,
    role: "cashier",
    invite_token: inviteRes.body.token,
  });
  expect(registerRes.status).toBe(201);
  const cashierCookie = extractTokenCookie(registerRes.headers["set-cookie"]);
  const cashierUserId = registerRes.body.data.user.id as string;
  const membership = await prisma.userOrganization.findUnique({
    where: { user_id: cashierUserId },
  });
  if (!membership) throw new Error("Pending membership was not created");

  const loginAs = async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    return extractTokenCookie(login.headers["set-cookie"]);
  };

  return { org, cashierCookie, cashierUserId, membership, loginAs };
}

describe("Staff approval gate", () => {
  it("shows pending cashiers in the pending list", async () => {
    const { org, cashierUserId } = await setupPendingCashier();

    const response = await request(app)
      .get("/api/staff/assignments")
      .set("Cookie", [org.cookie]);

    expect(response.status).toBe(200);
    const pending = response.body.pending as Array<{
      id: string;
      approved: boolean;
    }>;
    expect(pending.some((a) => !a.approved)).toBe(true);

    const stored = await prisma.userOrganization.findUnique({
      where: { user_id: cashierUserId },
    });
    expect(stored?.approved).toBe(false);
  }, 120000);

  it("approves a pending cashier into active duty with POS access", async () => {
    const { org, membership, loginAs } = await setupPendingCashier();

    const before = await request(app)
      .get("/api/customers")
      .set("Cookie", [membership ? await loginAs() : ""]);
    expect(before.status).toBe(403);

    const approve = await request(app)
      .post(`/api/staff/assignments/${membership.id}/approve`)
      .set("Cookie", [org.cookie]);
    expect(approve.status).toBe(200);

    const stored = await prisma.userOrganization.findUnique({
      where: { id: membership.id },
    });
    expect(stored?.approved).toBe(true);
    expect(stored?.permissions).toContain("POS_ACCESS");

    const after = await request(app)
      .get("/api/customers")
      .set("Cookie", [await loginAs()]);
    expect(after.status).toBe(200);
  }, 120000);

  it("sets permissions at approval and grants only what is assigned", async () => {
    const { org, membership, loginAs } = await setupPendingCashier();

    const approve = await request(app)
      .post(`/api/staff/assignments/${membership.id}/approve`)
      .set("Cookie", [org.cookie])
      .send({ permissions: ["VIEW_DASHBOARD"] });
    expect(approve.status).toBe(200);

    const stored = await prisma.userOrganization.findUnique({
      where: { id: membership.id },
    });
    expect(stored?.approved).toBe(true);
    expect(stored?.permissions).toEqual(["VIEW_DASHBOARD"]);

    const cookie = await loginAs();
    const pos = await request(app)
      .get("/api/customers")
      .set("Cookie", [cookie]);
    expect(pos.status).toBe(403);

    const update = await request(app)
      .put(`/api/staff/assignments/${membership.id}`)
      .set("Cookie", [org.cookie])
      .send({ permissions: ["POS_ACCESS"] });
    expect(update.status).toBe(200);

    const posAfter = await request(app)
      .get("/api/customers")
      .set("Cookie", [cookie]);
    expect(posAfter.status).toBe(200);

    const invalid = await request(app)
      .put(`/api/staff/assignments/${membership.id}`)
      .set("Cookie", [org.cookie])
      .send({ permissions: ["NOT_A_PERMISSION"] });
    expect(invalid.status).toBe(400);
  }, 120000);

  it("rejects a pending cashier by removing the membership", async () => {
    const { org, membership, cashierUserId } = await setupPendingCashier();

    const remove = await request(app)
      .delete(`/api/staff/assignments/${membership.id}`)
      .set("Cookie", [org.cookie]);
    expect(remove.status).toBe(200);

    expect(
      await prisma.userOrganization.findUnique({
        where: { user_id: cashierUserId },
      })
    ).toBeNull();

    const listed = await request(app)
      .get("/api/staff/assignments")
      .set("Cookie", [org.cookie]);
    const pending = listed.body.pending as Array<unknown>;
    expect(pending.length).toBe(0);
  }, 120000);

  it("removes an active cashier and revokes access promptly", async () => {
    const { org, membership, loginAs } = await setupPendingCashier();

    const approve = await request(app)
      .post(`/api/staff/assignments/${membership.id}/approve`)
      .set("Cookie", [org.cookie]);
    expect(approve.status).toBe(200);

    const remove = await request(app)
      .delete(`/api/staff/assignments/${membership.id}`)
      .set("Cookie", [org.cookie]);
    expect(remove.status).toBe(200);

    const cookie = await loginAs();
    const pos = await request(app)
      .get("/api/customers")
      .set("Cookie", [cookie]);
    expect(pos.status).toBe(403);
  }, 120000);
});
