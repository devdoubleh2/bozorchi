import { describe, expect, it } from "bun:test";
import { sanitizeInput } from "../../src/middleware/sanitization";
import type { NextFunction, Request, Response } from "express";

describe("sanitizeInput middleware", () => {
  it("removes dangerous protocols including nested javascript payloads", () => {
    const req = {
      body: { payload: "jjavascript:avascript:alert(1)" },
      query: {},
      params: {},
    } as unknown as Request;

    const res = {} as Response;
    const next = (() => {}) as NextFunction;

    sanitizeInput(req, res, next);

    expect(req.body.payload).toBe("alert(1)");
  });

  it("removes dangerous data URIs including text/html with charset and svg", () => {
    const req = {
      body: {
        htmlPayload:
          "data:text/html;charset=utf-8;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        svgPayload:
          "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4=",
      },
      query: {},
      params: {},
    } as unknown as Request;

    const res = {} as Response;
    const next = (() => {}) as NextFunction;

    sanitizeInput(req, res, next);

    expect(req.body.htmlPayload).toBe("");
    expect(req.body.svgPayload).toBe("");
  });

  it("does not mangle plain text that contains words like online or only", () => {
    const req = {
      body: {
        description: "The status is online=true and the price is only=100",
      },
      query: {},
      params: {},
    } as unknown as Request;

    const res = {} as Response;
    const next = (() => {}) as NextFunction;

    sanitizeInput(req, res, next);

    expect(req.body.description).toBe(
      "The status is online=true and the price is only=100"
    );
  });
});
