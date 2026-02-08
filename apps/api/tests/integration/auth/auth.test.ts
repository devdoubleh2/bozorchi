import { describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../../app";
import { faker } from "@faker-js/faker";
import { AuthHelper } from "../../helpers/authHelper";

describe("Auth Integration", () => {
    const validUser = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: "Password123!",
        role: "admin",
        organization_name: faker.company.name(),
        store_name: faker.company.name() + " Store",
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        currency: "UZS"
    };

    it("POST /api/auth/register should register a new admin user", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send(validUser);

        if (response.status !== 201) {
            console.error("Register Error:", JSON.stringify(response.body, null, 2));
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("user");
        expect(response.body.user.email).toBe(validUser.email);
    }, 120000);

    it("POST /api/auth/register should fail with duplicate email", async () => {
        // Try to register same user again
        const response = await request(app)
            .post("/api/auth/register")
            .send(validUser);

        expect(response.status).toBe(400); // Or whatever error code for duplicate
    });

    it("POST /api/auth/login should login successfully", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: validUser.email,
                password: validUser.password
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
    });

    it("POST /api/auth/login should fail with invalid password", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: validUser.email,
                password: "WrongPassword123!"
            });

        expect(response.status).toBe(401);
    });

    it("GET /api/auth/profile should return user profile", async () => {
        const { token, user } = await AuthHelper.createAndLoginUser();

        const response = await request(app)
            .get("/api/auth/profile")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.email).toBe(user.email);
    });
});
