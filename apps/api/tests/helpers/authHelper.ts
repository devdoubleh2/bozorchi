import request from "supertest";
import app from "../../app";
import { faker } from "@faker-js/faker";

export const extractTokenCookie = (
  setCookieHeader?: string | string[]
): string => {
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader ?? ""];
  const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));

  if (!tokenCookie) {
    throw new Error("Auth token cookie was not set on response");
  }

  return tokenCookie.split(";")[0]!;
};

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

        const cookie = extractTokenCookie(registerResponse.headers["set-cookie"]);

        return {
            cookie,
            user: registerResponse.body.data.user,
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

        return extractTokenCookie(response.headers["set-cookie"]);
    }
}
