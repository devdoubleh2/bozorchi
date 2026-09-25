import { describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../../app";
import { prisma } from "../../../src/lib/prisma";
import { createMember, registerOwner } from "../../helpers/orgHelper";

describe("Store invites", () => {
  it("lets an owner create a scoped, expiring, single-use invite", async () => {
    const org = await registerOwner();

    const response = await request(app)
      .post("/api/staff/invites")
      .set("Cookie", [org.cookie])
      .send({ store_id: org.storeId, expires_in_days: 7 });

    expect(response.status).toBe(201);
    const { invite, token } = response.body;
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(16);
    expect(invite.organization_id).toBe(org.organizationId);
    expect(invite.store_id).toBe(org.storeId);
    expect(invite.status).toBe("outstanding");

    const record = await prisma.storeInvite.findUnique({
      where: { id: invite.id },
    });
    expect(record).not.toBeNull();
    expect(record?.token_hash).not.toBe(token);
    expect(record?.used_at).toBeNull();
    expect(record?.revoked_at).toBeNull();
  }, 120000);

  it("lets an owner create invites but forbids cashiers", async () => {
    const org = await registerOwner();
    const cashier = await createMember(org.organizationId, org.storeId, {
      role: "cashier",
    });

    const asOwner = await request(app)
      .post("/api/staff/invites")
      .set("Cookie", [org.cookie])
      .send({ store_id: org.storeId });
    expect(asOwner.status).toBe(201);

    for (const [method, path] of [
      ["post", "/api/staff/invites"],
      ["get", "/api/staff/invites"],
    ] as const) {
      const res =
        method === "post"
          ? await request(app)
              .post(path)
              .set("Cookie", [cashier.cookie])
              .send({ store_id: org.storeId })
          : await request(app).get(path).set("Cookie", [cashier.cookie]);
      expect(res.status).toBe(403);
    }

    const revokeAsCashier = await request(app)
      .delete(`/api/staff/invites/some-invite-id`)
      .set("Cookie", [cashier.cookie]);
    expect(revokeAsCashier.status).toBe(403);
  }, 120000);

  it("lists outstanding invites and revokes an unused one", async () => {
    const org = await registerOwner();

    const created = await request(app)
      .post("/api/staff/invites")
      .set("Cookie", [org.cookie])
      .send({ store_id: org.storeId });
    expect(created.status).toBe(201);
    const inviteId = created.body.invite.id as string;

    const listed = await request(app)
      .get("/api/staff/invites")
      .set("Cookie", [org.cookie]);
    expect(listed.status).toBe(200);
    const invites = listed.body.invites as Array<{ id: string; status: string }>;
    expect(invites.some((i) => i.id === inviteId && i.status === "outstanding")).toBe(
      true
    );

    const revoked = await request(app)
      .delete(`/api/staff/invites/${inviteId}`)
      .set("Cookie", [org.cookie]);
    expect(revoked.status).toBe(200);

    const relisted = await request(app)
      .get("/api/staff/invites")
      .set("Cookie", [org.cookie]);
    const after = (relisted.body.invites as Array<{ id: string; status: string }>).find(
      (i) => i.id === inviteId
    );
    expect(after?.status).toBe("revoked");

    const revokeAgain = await request(app)
      .delete(`/api/staff/invites/${inviteId}`)
      .set("Cookie", [org.cookie]);
    expect(revokeAgain.status).toBe(400);

    const revokeUnknown = await request(app)
      .delete("/api/staff/invites/does-not-exist")
      .set("Cookie", [org.cookie]);
    expect(revokeUnknown.status).toBe(404);
  }, 120000);

  it("lists expired unused invites with their status", async () => {
    const org = await registerOwner();

    const created = await request(app)
      .post("/api/staff/invites")
      .set("Cookie", [org.cookie])
      .send({ store_id: org.storeId });
    expect(created.status).toBe(201);
    const inviteId = created.body.invite.id as string;

    await prisma.storeInvite.update({
      where: { id: inviteId },
      data: { expires_at: new Date(Date.now() - 1000) },
    });

    const listed = await request(app)
      .get("/api/staff/invites")
      .set("Cookie", [org.cookie]);
    expect(listed.status).toBe(200);
    const invites = listed.body.invites as Array<{ id: string; status: string }>;
    expect(invites.some((i) => i.id === inviteId && i.status === "expired")).toBe(
      true
    );
  }, 120000);

  it("rejects invites for stores outside the organization and bad expiry", async () => {
    const org = await registerOwner();
    const other = await registerOwner();

    const foreign = await request(app)
      .post("/api/staff/invites")
      .set("Cookie", [org.cookie])
      .send({ store_id: other.storeId });
    expect(foreign.status).toBe(404);

    for (const expires_in_days of [0, 31]) {
      const bad = await request(app)
        .post("/api/staff/invites")
        .set("Cookie", [org.cookie])
        .send({ store_id: org.storeId, expires_in_days });
      expect(bad.status).toBe(400);
    }

    const missing = await request(app)
      .post("/api/staff/invites")
      .set("Cookie", [org.cookie])
      .send({});
    expect(missing.status).toBe(400);
    expect(missing.body.message).toMatch(/store_id/);
  }, 120000);
});
