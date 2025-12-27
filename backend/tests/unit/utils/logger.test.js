import { jest } from "@jest/globals";

// We need to mock winston before importing logger
// But logger is a singleton created at module load time.
// So we can check the exported object properties.

import logger from "../../../utils/logger.js";

describe("Logger Utility", () => {
    test("should export a logger object with standard methods", () => {
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe("function");
        expect(typeof logger.error).toBe("function");
        expect(typeof logger.warn).toBe("function");
        expect(typeof logger.debug).toBe("function");
    });
});
