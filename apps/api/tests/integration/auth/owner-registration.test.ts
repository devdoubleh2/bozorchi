import { describe, expect, it } from "bun:test";
import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "../../../app";
import { getTenantPrisma, prisma } from "../../../src/lib/prisma";

const ownerPayload = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: "Password123!",
  role: "admin",
  organization_name: faker.company.name(),
  store_name: `${faker.company.name()} Store`,
  address: faker.location.streetAddress(),
  phone: faker.phone.number(),
  currency: "UZS",
});

const extractTokenCookie = (setCookieHeader?: string[]): string => {
  const tokenCookie = setCookieHeader?.find((cookie) =>
    cookie.startsWith("token=")
  );
  if (!tokenCookie) {
    throw new Error("Auth token cookie was not set on response");
  }
  return tokenCookie.split(";")[0]!;
};

describe("POST /api/auth/register owner flow", () => {
  it("registers an owner with company, first store, and approved membership", async () => {
    const payload = ownerPayload();

    const response = await request(app)
      .post("/api/auth/register")
      .send(payload);

    if (response.status !== 201) {
      console.error("Register Error:", JSON.stringify(response.body, null, 2));
    }
    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.data.user.email).toBe(payload.email);

    const cookie = extractTokenCookie(
      response.headers["set-cookie"] as string[] | undefined
    );
    expect(cookie.startsWith("token=")).toBe(true);

    const userId = response.body.data.user.id as string;
    const membership = await prisma.userOrganization.findUnique({
      where: { user_id: userId },
    });
    expect(membership).not.toBeNull();
    expect(membership?.approved).toBe(true);

    const organization = await prisma.organization.findUnique({
      where: { id: membership!.organization_id },
    });
    expect(organization).not.toBeNull();
    expect(organization?.name).toBe(payload.organization_name);
    expect(organization?.owner_id).toBe(userId);

    const tenantPrisma = await getTenantPrisma(membership!.organization_id);
    const store = await tenantPrisma.store.findUnique({
      where: { id: membership!.store_id },
    });
    expect(store).not.toBeNull();
    expect(store?.name).toBe(payload.store_name);
  }, 120000);

  it("fails with a field-level error when store_name is missing", async () => {
    const { store_name: _omitted, ...payload } = ownerPayload();

    const response = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/store_name/);
  }, 60000);

  it("fails cleanly on duplicate email without creating anything", async () => {
    const payload = ownerPayload();

    const first = await request(app).post("/api/auth/register").send(payload);
    expect(first.status).toBe(201);

    const usersBefore = await prisma.user.count();
    const orgsBefore = await prisma.organization.count();

    const second = await request(app).post("/api/auth/register").send({
      ...payload,
      name: faker.person.fullName(),
    });
    expect(second.status).toBe(400);
    expect(second.body.message).toMatch(/already exists/i);

    expect(await prisma.user.count()).toBe(usersBefore);
    expect(await prisma.organization.count()).toBe(orgsBefore);
  }, 120000);

  it("rejects passwords the shared policy forbids", async () => {
    for (const password of ["short1", "password", "PASSWORD123", "Pass123"]) {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...ownerPayload(), password });
      expect(response.status).toBe(400);
    }
  }, 120000);
});
