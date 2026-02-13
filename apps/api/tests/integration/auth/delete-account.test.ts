import { describe, expect, it } from "bun:test";
import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "../../../app";
import { getTenantPrisma, prisma } from "../../../src/lib/prisma";
import type { Server } from "http";

const extractTokenCookie = (setCookieHeader?: string[]): string => {
  const tokenCookie = setCookieHeader?.find((cookie) =>
    cookie.startsWith("token=")
  );

  if (!tokenCookie) {
    throw new Error("Auth token cookie was not set on response");
  }

  return tokenCookie.split(";")[0]!;
};

describe("DELETE /api/auth/me safeguards", () => {
  it("does not wipe organization data when a non-owner user deletes their account", async () => {
    const server = await new Promise<Server>((resolve, reject) => {
      const startedServer = app.listen(0, "127.0.0.1", () =>
        resolve(startedServer)
      );
      startedServer.on("error", reject);
    });

    const api = request(server);

    try {
      const adminEmail = faker.internet.email();
      const adminPassword = "Password123!";

      const adminRegisterRes = await api
        .post("/api/auth/register")
        .send({
          name: faker.person.fullName(),
          email: adminEmail,
          password: adminPassword,
          role: "admin",
          organization_name: faker.company.name(),
          store_name: faker.company.name(),
          address: faker.location.streetAddress(),
          phone: faker.phone.number(),
          currency: "UZS",
        });

      expect(adminRegisterRes.status).toBe(201);
      const adminUserId = adminRegisterRes.body.user.id as string;

      const adminMembership = await prisma.userOrganization.findUnique({
        where: { user_id: adminUserId },
      });
      expect(adminMembership).not.toBeNull();
      if (!adminMembership) {
        throw new Error("Admin membership was not created");
      }

      const tenantPrisma = await getTenantPrisma(adminMembership.organization_id);
      const storeBeforeDelete = await tenantPrisma.store.findUnique({
        where: { id: adminMembership.store_id },
      });
      expect(storeBeforeDelete).not.toBeNull();

      const staffRegisterRes = await api
        .post("/api/auth/register")
        .send({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: "Password123!",
          role: "user",
          store_id: adminMembership.store_id,
        });

      expect(staffRegisterRes.status).toBe(201);
      const staffUserId = staffRegisterRes.body.user.id as string;
      const staffCookie = extractTokenCookie(
        staffRegisterRes.headers["set-cookie"] as string[] | undefined
      );

      const deleteMeRes = await api
        .delete("/api/auth/me")
        .set("Cookie", [staffCookie]);
      expect(deleteMeRes.status).toBe(200);

      const storeAfterDelete = await tenantPrisma.store.findUnique({
        where: { id: adminMembership.store_id },
      });
      expect(storeAfterDelete).not.toBeNull();

      const deletedStaff = await prisma.user.findUnique({
        where: { id: staffUserId },
      });
      expect(deletedStaff).toBeNull();

      const ownerStillExists = await prisma.user.findUnique({
        where: { id: adminUserId },
      });
      expect(ownerStillExists).not.toBeNull();

      const ownerMembershipAfterDelete = await prisma.userOrganization.findUnique({
        where: { user_id: adminUserId },
      });
      expect(ownerMembershipAfterDelete).not.toBeNull();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  }, 120000);
});
