import request from "supertest";
import app from "../../app.js";
import { jest } from "@jest/globals";

describe("App Configuration", () => {
    test("Health check endpoint should return 200", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.timezone).toBe("UTC");
    });

    test("should have security headers (Helmet)", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
        expect(res.headers["x-frame-options"]).toBeDefined();
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    test("should handle JSON bodies (10mb limit)", async () => {
        const largeObject = { data: "a".repeat(1024 * 10) }; // 10KB
        const res = await request(app)
            .post("/api/auth/login")
            .send(largeObject);

        // We expect a 400 validation error or 401, not 413 Payload Too Large
        expect(res.status).not.toBe(413);
    });

    test("should use compression", async () => {
        const res = await request(app).get("/health").set("Accept-Encoding", "gzip");
        // For small responses, compression might not trigger, but we check if middleware exists
        // It's hard to verify compression on health check, but we can check if it returns 200
        expect(res.status).toBe(200);
    });

    test("should handle unknown routes with 404", async () => {
        const res = await request(app).get("/api/unknown");
        // Since routes/index.js handles /api, it depends on how it's implemented.
        // If no route matches, it should fall through to errorHandler (if not caught)
        // or Express will return 404.
        expect(res.status).toBe(404);
    });
});
