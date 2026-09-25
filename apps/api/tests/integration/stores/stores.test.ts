import { describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../../app";
import { faker } from "@faker-js/faker";
import { AuthHelper } from "../../helpers/authHelper";

describe("Store Integration", () => {
    it("POST /api/stores/create should create a new store", async () => {
        const { cookie } = await AuthHelper.createAndLoginUser();

        const newStore = {
            name: faker.company.name(),
            address: faker.location.streetAddress(),
            phone: "+998901234567",
            currency: "UZS"
        };

        const response = await request(app)
            .post("/api/stores/create")
            .set("Cookie", [cookie])
            .send(newStore);

        if (response.status !== 201) {
            console.error("Create Store Error:", JSON.stringify(response.body, null, 2));
        }

        expect(response.status).toBe(201);
        expect(response.body.store.name).toBe(newStore.name);
    }, 120000);

    it("GET /api/stores should list stores", async () => {
        const { cookie } = await AuthHelper.createAndLoginUser();

        const response = await request(app)
            .get("/api/stores")
            .set("Cookie", [cookie]);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.stores)).toBe(true);
        // Should have at least the default store created during registration
        expect(response.body.stores.length).toBeGreaterThanOrEqual(1);
    });
});
