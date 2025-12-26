/**
 * Unit Tests for CORS Configuration (config/corsOptions.js)
 *
 * Tests CORS origin validation, credentials, methods, headers, and maxAge
 * Requirements: 11.5
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import corsOptions from "../../../config/corsOptions.js";
import allowedOrigins from "../../../config/allowedOrigins.js";

describe("CORS Configuration Tests", () => {
  describe("corsOptions structure", () => {
    test("should have credentials enabled", () => {
      expect(corsOptions.credentials).toBe(true);
    });

    test("should have correct allowed methods", () => {
      const expectedMethods = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ];
      expect(corsOptions.methods).toEqual(expectedMethods);
    });

    test("should have correct allowed headers", () => {
      const expectedHeaders = [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
      ];
      expect(corsOptions.allowedHeaders).toEqual(expectedHeaders);
    });

    test("should have correct exposed headers", () => {
      const expectedHeaders = [
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ];
      expect(corsOptions.exposedHeaders).toEqual(expectedHeaders);
    });

    test("should have maxAge of 86400 (24 hours)", () => {
      expect(corsOptions.maxAge).toBe(86400);
    });

    test("should have optionsSuccessStatus of 200", () => {
      expect(corsOptions.optionsSuccessStatus).toBe(200);
    });
  });

  describe("origin validation", () => {
    test("should allow requests with no origin (mobile apps, Postman)", (done) => {
      corsOptions.origin(undefined, (error, allowed) => {
        expect(error).toBeNull();
        expect(allowed).toBe(true);
        done();
      });
    });

    test("should allow localhost:3000 (React dev server)", (done) => {
      corsOptions.origin("http://localhost:3000", (error, allowed) => {
        expect(error).toBeNull();
        expect(allowed).toBe(true);
        done();
      });
    });

    test("should allow localhost:5173 (Vite dev server)", (done) => {
      corsOptions.origin("http://localhost:5173", (error, allowed) => {
        expect(error).toBeNull();
        expect(allowed).toBe(true);
        done();
      });
    });

    test("should block origins not in allowed list", (done) => {
      corsOptions.origin("http://malicious-site.com", (error, allowed) => {
        expect(error).toBeDefined();
        expect(error.message).toBe("Not allowed by CORS");
        done();
      });
    });

    test("should validate against allowedOrigins list", (done) => {
      // Test with first allowed origin
      const firstAllowedOrigin = allowedOrigins[0];
      corsOptions.origin(firstAllowedOrigin, (error, allowed) => {
        expect(error).toBeNull();
        expect(allowed).toBe(true);
        done();
      });
    });
  });

  describe("allowedOrigins list", () => {
    test("should include development origins", () => {
      expect(allowedOrigins).toContain("http://localhost:3000");
      expect(allowedOrigins).toContain("http://localhost:5173");
    });

    test("should be an array", () => {
      expect(Array.isArray(allowedOrigins)).toBe(true);
    });

    test("should have at least 2 origins (development)", () => {
      expect(allowedOrigins.length).toBeGreaterThanOrEqual(2);
    });
  });
});
