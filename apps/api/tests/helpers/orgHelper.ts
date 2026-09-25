import bcrypt from "bcryptjs";
import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "../../app";
import { prisma } from "../../src/lib/prisma";
import { extractTokenCookie } from "./authHelper";

export interface TestOrg {
  cookie: string;
  userId: string;
  email: string;
  password: string;
  organizationId: string;
  storeId: string;
}

export async function registerOwner(): Promise<TestOrg> {
  const payload = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: "Password123!",
    role: "owner",
    organization_name: faker.company.name(),
    store_name: `${faker.company.name()} Store`,
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
    currency: "UZS",
  };
  const response = await request(app).post("/api/auth/register").send(payload);
  if (response.status !== 201) {
    throw new Error(`Failed to register owner: ${JSON.stringify(response.body)}`);
  }
  const cookie = extractTokenCookie(response.headers["set-cookie"]);
  const userId = response.body.data.user.id as string;
  const membership = await prisma.userOrganization.findUnique({
    where: { user_id: userId },
  });
  if (!membership) throw new Error("Owner membership was not created");
  return {
    cookie,
    userId,
    email: payload.email,
    password: payload.password,
    organizationId: membership.organization_id,
    storeId: membership.store_id,
  };
}

// NOTE: `role` here is the stored membership value ("owner" | "cashier").
export async function createMember(
  organizationId: string,
  storeId: string,
  overrides: { role?: "owner" | "cashier"; approved?: boolean } = {}
): Promise<{ cookie: string; userId: string; email: string }> {
  const email = faker.internet.email();
  const password = "Password123!";
  const user = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email,
      password_hash: await bcrypt.hash(password, 12),
    },
  });
  await prisma.userOrganization.create({
    data: {
      user_id: user.id,
      organization_id: organizationId,
      store_id: storeId,
      role: overrides.role ?? "cashier",
      approved: overrides.approved ?? true,
    },
  });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  if (login.status !== 200) {
    throw new Error(`Failed to login member: ${JSON.stringify(login.body)}`);
  }
  return {
    cookie: extractTokenCookie(login.headers["set-cookie"]),
    userId: user.id,
    email,
  };
}
