import { describe, expect, it } from "bun:test";
import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "../../../app";
import { prisma } from "../../../src/lib/prisma";
import { INVITE_ERROR, INVITE_ERROR_MESSAGE } from "../../../src/services/invites";
import { extractTokenCookie } from "../../helpers/authHelper";
import { registerOwner } from "../../helpers/orgHelper";

async function createInvite(cookie: string, storeId: string) {
  const response = await request(app)
    .post("/api/staff/invites")
    .set("Cookie", [cookie])
    .send({ store_id: storeId });
  expect(response.status).toBe(201);
  return response.body as { invite: { id: string }; token: string };
}

const cashierPayload = (token: string) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: "Password123!",
  role: "cashier",
  invite_token: token,
});

describe("Cashier invite redemption", () => {
  it("redeems a valid invite into a pending membership and consumes the token", async () => {
    const org = await registerOwner();
    const { invite, token } = await createInvite(org.cookie, org.storeId);

    const response = await request(app)
      .post("/api/auth/register")
      .send(cashierPayload(token));

    if (response.status !== 201) {
      console.error("Redeem Error:", JSON.stringify(response.body, null, 2));
    }
    expect(response.status).toBe(201);
    extractTokenCookie(response.headers["set-cookie"]);

    const userId = response.body.data.user.id as string;
    expect(response.body.data.user.membership.role).toBe("cashier");
    const membership = await prisma.userOrganization.findUnique({
      where: { user_id: userId },
    });
    expect(membership).not.toBeNull();
    expect(membership?.organization_id).toBe(org.organizationId);
    expect(membership?.store_id).toBe(org.storeId);
    expect(membership?.role).toBe("user");
    expect(membership?.approved).toBe(false);

    const used = await prisma.storeInvite.findUnique({
      where: { id: invite.id },
    });
    expect(used?.used_at).not.toBeNull();
  }, 120000);

  it("rejects expired, used, revoked, and unknown tokens with the dedicated error", async () => {
    const org = await registerOwner();
    const { invite, token } = await createInvite(org.cookie, org.storeId);

    const expired = await createInvite(org.cookie, org.storeId);
    await prisma.storeInvite.update({
      where: { id: expired.invite.id },
      data: { expires_at: new Date(Date.now() - 1000) },
    });

    const revoked = await createInvite(org.cookie, org.storeId);
    const revokeRes = await request(app)
      .delete(`/api/staff/invites/${revoked.invite.id}`)
      .set("Cookie", [org.cookie]);
    expect(revokeRes.status).toBe(200);

    // Consume the valid token once
    const first = await request(app)
      .post("/api/auth/register")
      .send(cashierPayload(token));
    expect(first.status).toBe(201);
    void invite;

    for (const badToken of [
      token,
      expired.token,
      revoked.token,
      "unknown-token",
    ]) {
      const response = await request(app)
        .post("/api/auth/register")
        .send(cashierPayload(badToken));
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(INVITE_ERROR_MESSAGE);
      expect(response.body.code).toBe(INVITE_ERROR);
    }
  }, 120000);

  it("blocks pending cashiers from protected surfaces but lets them read identity", async () => {
    const org = await registerOwner();
    const { token } = await createInvite(org.cookie, org.storeId);
    const response = await request(app)
      .post("/api/auth/register")
      .send(cashierPayload(token));
    expect(response.status).toBe(201);
    const cookie = extractTokenCookie(response.headers["set-cookie"]);

    const profile = await request(app)
      .get("/api/auth/profile")
      .set("Cookie", [cookie]);
    expect(profile.status).toBe(200);

    const myStore = await request(app)
      .get("/api/stores/my-store")
      .set("Cookie", [cookie]);
    expect(myStore.status).toBe(200);

    const staff = await request(app)
      .get("/api/staff/assignments")
      .set("Cookie", [cookie]);
    expect(staff.status).toBe(403);

    const stores = await request(app)
      .get("/api/stores")
      .set("Cookie", [cookie]);
    expect(staff.status).toBe(403);
    expect(stores.status).toBe(403);
  }, 120000);

  it("fails duplicate-email registration with the email error even when the token is dead", async () => {
    const org = await registerOwner();
    const { invite, token } = await createInvite(org.cookie, org.storeId);

    const payload = cashierPayload(token);
    const first = await request(app).post("/api/auth/register").send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/auth/register")
      .send({ ...cashierPayload(token), email: payload.email });
    expect(second.status).toBe(400);
    expect(second.body.message).toMatch(/already exists/i);

    const consumed = await prisma.storeInvite.findUnique({
      where: { id: invite.id },
    });
    expect(consumed?.used_at).not.toBeNull();

    const retry = await request(app)
      .post("/api/auth/register")
      .send({ ...cashierPayload(token), email: faker.internet.email() });
    expect(retry.status).toBe(400);
    expect(retry.body.code).toBe(INVITE_ERROR);
  }, 120000);

  it("leaves a valid invite usable after a duplicate-email attempt", async () => {
    const org = await registerOwner();
    const { invite, token } = await createInvite(org.cookie, org.storeId);

    const duplicate = await request(app)
      .post("/api/auth/register")
      .send({
        name: faker.person.fullName(),
        email: org.email,
        password: "Password123!",
        role: "cashier",
        invite_token: token,
      });
    expect(duplicate.status).toBe(400);
    expect(duplicate.body.message).toMatch(/already exists/i);

    const untouched = await prisma.storeInvite.findUnique({
      where: { id: invite.id },
    });
    expect(untouched?.used_at).toBeNull();

    const retry = await request(app)
      .post("/api/auth/register")
      .send({
        ...cashierPayload(token),
        email: faker.internet.email(),
      });
    expect(retry.status).toBe(201);
    const reused = await prisma.storeInvite.findUnique({
      where: { id: invite.id },
    });
    expect(reused?.used_at).not.toBeNull();
  }, 120000);

  it("requires an invite token instead of a raw store id", async () => {
    const org = await registerOwner();

    const withoutToken = await request(app)
      .post("/api/auth/register")
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: "Password123!",
        role: "cashier",
      });
    expect(withoutToken.status).toBe(400);
    expect(withoutToken.body.message).toMatch(/invite_token/);

    const withStoreId = await request(app)
      .post("/api/auth/register")
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: "Password123!",
        role: "cashier",
        store_id: org.storeId,
      });
    expect(withStoreId.status).toBe(400);
  }, 120000);
});
