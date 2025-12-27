import { jest } from "@jest/globals";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

// Mock dependencies
const mockListen = jest.fn((port, cb) => cb && cb());
const mockClose = jest.fn((cb) => cb && cb());
const mockCreateServer = jest.fn(() => ({
    listen: mockListen,
    close: mockClose
}));

jest.unstable_mockModule("http", () => ({
    default: {
        createServer: mockCreateServer
    }
}));

jest.unstable_mockModule("../../config/db.js", () => ({
    connectDB: jest.fn().mockResolvedValue(true),
    disconnectDB: jest.fn().mockResolvedValue(true)
}));

jest.unstable_mockModule("../../utils/socketInstance.js", () => ({
    initializeSocket: jest.fn().mockReturnValue({}),
    getIO: jest.fn().mockReturnValue({})
}));

jest.unstable_mockModule("../../utils/socket.js", () => ({
    default: jest.fn(),
    setupSocketHandlers: jest.fn()
}));

jest.unstable_mockModule("../../utils/validateEnv.js", () => ({
    default: jest.fn()
}));

jest.unstable_mockModule("../../app.js", () => ({
    default: {}
}));

// Mock logger
jest.unstable_mockModule("../../utils/logger.js", () => ({
    default: {
        info: jest.fn(),
        error: jest.fn()
    }
}));

describe("Server Configuration", () => {
    test("should set UTC timezone correctly", async () => {
        // Just importing the file should trigger the TZ set
        // But we wait for it to execute
        await import("../../server.js");
        expect(process.env.TZ).toBe("UTC");
    });
});
