/**
 * Unit Tests for Allowed Origins Configuration (config/allowedOrigins.js)
 *
 * Tests CORS allowed origins list for development and production environments
 * Requirements: 11.1, 11.5
 */

import { describe, test, expect } from "@jest/globals";
import allowedOrigins from "../../../config/allowedOrigins.js";

describe("Allowed Origins Tests", () => {
  describe("Development origins", () => {
    test("should include localhost:3000 (React dev server)", () => {
      expect(allowedOrigins).toContain("http://localhost:3000");
    });

    test("should include localhost:5173 (Vite dev server)", () => {
      expect(allowedOrigins).toContain("http://localhost:5173");
    });

    test("should be an array", () => {
      expect(Array.isArray(allowedOrigins)).toBe(true);
    });

    test("should have at least 2 origins", () => {
      expect(allowedOrigins.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Origins list structure", () => {
    test("should contain only valid HTTP/HTTPS URLs", () => {
      allowedOrigins.forEach((origin) => {
        expect(origin).toMatch(/^https?:\/\//);
      });
    });

    test("should not contain empty strings", () => {
      allowedOrigins.forEach((origin) => {
        expect(origin.length).toBeGreaterThan(0);
      });
    });

    test("should not contain duplicate origins", () => {
      const uniqueOrigins = [...new Set(allowedOrigins)];
      expect(uniqueOrigins.length).toBe(allowedOrigins.length);
    });
  });

  describe("Production environment handling", () => {
    test("should handle CLIENT_URL from environment", () => {
      // If CLIENT_URL is set in production, it should be included
      if (process.env.NODE_ENV === "production" && process.env.CLIENT_URL) {
        expect(allowedOrigins).toContain(process.env.CLIENT_URL);
      }
    });

    test("should handle ALLOWED_ORIGINS from environment", () => {
      // If ALLOWED_ORIGINS is set in production, they should be included
      if (
        process.env.NODE_ENV === "production" &&
        process.env.ALLOWED_ORIGINS
      ) {
        const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",").map(
          (origin) => origin.trim()
        );
        additionalOrigins.forEach((origin) => {
          expect(allowedOrigins).toContain(origin);
        });
      }
    });
  });
});
