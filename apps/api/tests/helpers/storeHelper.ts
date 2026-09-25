import request from "supertest";
import app from "../../app";
import { faker } from "@faker-js/faker";

export class StoreHelper {
    static async createStore(cookie: string) {
        const name = faker.company.name();
        const address = faker.location.streetAddress();
        const phone = "+998901234567";

        const response = await request(app)
            .post("/api/stores/create")
            .set("Cookie", [cookie])
            .send({
                name,
                address,
                phone,
                currency: "UZS",
            });

        if (response.status !== 201) {
            // If 403, it might be due to permissions (only admins/owners).
            // The AuthHelper creates a user who owns an organization by default?
            // Let's check the register flow.
            // Actually, the register flow creates a user.
            // Users need to be admins of an organization to create stores.
            // We might need to handle organization creation if registration doesn't do it.
            // Based on AuthController, register creates a user.
            // It seems we might need to check how organizations are created or if the user is an owner.
            // Looking at AuthController.register logic -> authService.register
            throw new Error(`Failed to create store: ${JSON.stringify(response.body)}`);
        }

        return response.body.store;
    }
}
