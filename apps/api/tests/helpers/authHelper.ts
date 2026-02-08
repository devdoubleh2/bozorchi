import request from "supertest";
import app from "../../app";
import { faker } from "@faker-js/faker";

export class AuthHelper {
    static async createAndLoginUser() {
        // Admin registration details
        const email = faker.internet.email();
        const password = "Password123!"; // Strong password
        const name = faker.person.fullName();
        const organizationName = faker.company.name();
        const storeName = faker.company.name();
        const phone = faker.phone.number();
        const address = faker.location.streetAddress();

        // Register as Admin
        const registerResponse = await request(app)
            .post("/api/auth/register")
            .send({
                role: "admin",
                email,
                password,
                name,
                organization_name: organizationName,
                store_name: storeName,
                phone,
                address,
                currency: "UZS"
            });

        if (registerResponse.status !== 201) {
            throw new Error(`Failed to register user: ${JSON.stringify(registerResponse.body)}`);
        }

        return {
            token: registerResponse.body.token,
            user: registerResponse.body.user,
            email,
            password,
        };
    }

    static async loginUser(email: string, password: string) {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email, password });

        if (response.status !== 200) {
            throw new Error(`Failed to login user: ${JSON.stringify(response.body)}`);
        }

        return response.body.token;
    }
}
