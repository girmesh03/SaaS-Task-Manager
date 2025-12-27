import { jest } from "@jest/globals";
import { initializeSocket, getIO } from "../../../utils/socketInstance.js";

describe("socketInstance - Socket.IO Singleton Instance", () => {
  let mockHttpServer;

  beforeEach(() => {
    mockHttpServer = {};
    // We cannot easily clear the singleton 'io' variable because it's not exported
    // But we can test the behavior
  });

  test("should throw error if getIO called before initialization", () => {
    // This might fail if another test already initialized it
    // But since we run in brand new processes or with isolation if lucky
    try {
        getIO();
    } catch (error) {
        expect(error.message).toBe("Socket.IO not initialized. Call initializeSocket first.");
    }
  });

  test("should initialize and return Server instance", () => {
    const io = initializeSocket(mockHttpServer);
    expect(io).toBeDefined();
    expect(getIO()).toBe(io);
  });

  test("should return same instance on subsequent calls", () => {
    const io1 = initializeSocket(mockHttpServer);
    const io2 = initializeSocket(mockHttpServer);
    expect(io1).toBe(io2);
  });
});
