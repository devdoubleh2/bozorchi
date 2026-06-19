import { afterEach, describe, expect, it } from "bun:test";
import request from "supertest";

let importCounter = 0;

const originalNodeEnv = process.env["NODE_ENV"];
const originalEnableApiDocs = process.env["ENABLE_API_DOCS"];
const originalEnableOpenApiJson = process.env["ENABLE_OPENAPI_JSON"];

async function importFreshApp() {
  importCounter += 1;
  const module = await import(`../../app.ts?docs-test=${importCounter}`);
  return module.default;
}

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env["NODE_ENV"];
  } else {
    process.env["NODE_ENV"] = originalNodeEnv;
  }

  if (originalEnableApiDocs === undefined) {
    delete process.env["ENABLE_API_DOCS"];
  } else {
    process.env["ENABLE_API_DOCS"] = originalEnableApiDocs;
  }

  if (originalEnableOpenApiJson === undefined) {
    delete process.env["ENABLE_OPENAPI_JSON"];
  } else {
    process.env["ENABLE_OPENAPI_JSON"] = originalEnableOpenApiJson;
  }
});

describe("API docs integration", () => {
  it("GET /api/docs returns Swagger UI HTML outside production", async () => {
    process.env["NODE_ENV"] = "test";
    delete process.env["ENABLE_API_DOCS"];
    delete process.env["ENABLE_OPENAPI_JSON"];

    const app = await importFreshApp();
    const response = await request(app).get("/api/docs/");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("Swagger UI");
  });

  it("GET /api/openapi.json returns the OpenAPI document when enabled", async () => {
    process.env["NODE_ENV"] = "production";
    process.env["ENABLE_API_DOCS"] = "false";
    process.env["ENABLE_OPENAPI_JSON"] = "true";

    const app = await importFreshApp();
    const response = await request(app).get("/api/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.1.0");
    expect(response.body.info.title).toBe("Bozorchi API");
    expect(response.body.components.securitySchemes.CookieAuth).toEqual(
      expect.objectContaining({
        type: "apiKey",
        in: "cookie",
        name: "token",
      })
    );
    expect(response.body.components.securitySchemes.BearerAuth).toEqual(
      expect.objectContaining({
        type: "http",
        scheme: "bearer",
      })
    );
  });

  it("docs endpoints are unavailable when disabled in production", async () => {
    process.env["NODE_ENV"] = "production";
    process.env["ENABLE_API_DOCS"] = "false";
    delete process.env["ENABLE_OPENAPI_JSON"];

    const app = await importFreshApp();
    const docsResponse = await request(app).get("/api/docs/");
    const specResponse = await request(app).get("/api/openapi.json");

    expect(docsResponse.status).toBe(404);
    expect(specResponse.status).toBe(404);
  });

  it("generated spec includes representative public and protected routes", async () => {
    process.env["NODE_ENV"] = "test";
    process.env["ENABLE_OPENAPI_JSON"] = "true";

    const app = await importFreshApp();
    const response = await request(app).get("/api/openapi.json");
    const paths = response.body.paths;

    expect(response.status).toBe(200);
    expect(paths["/health"].get.security).toBeUndefined();
    expect(paths["/api/auth/login"].post.security).toBeUndefined();
    expect(paths["/api/products/list"].get.security).toEqual([
      { CookieAuth: [] },
      { BearerAuth: [] },
    ]);
    expect(paths["/api/transactions"].get.security).toEqual([
      { CookieAuth: [] },
      { BearerAuth: [] },
    ]);
  });
});
