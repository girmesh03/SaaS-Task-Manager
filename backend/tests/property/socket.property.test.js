import { jest } from "@jest/globals";
import fc from "fast-check";

// Mock socketInstance
const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
const mockIO = { to: mockTo };

jest.unstable_mockModule("../../utils/socketInstance.js", () => ({
  getIO: jest.fn().mockReturnValue(mockIO),
}));

const { emitToRooms } = await import("../../utils/socketEmitter.js");

describe("Socket Emitter Property-Based Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * **Feature: saas-task-manager-mvp, Property 13: Socket Event Integrity**
     * **Validates: Requirements 8.1, 8.7, 8.12**
     */
    test("Property 13: emitToRooms should correctly call Socket.IO methods for any input", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1 }), // Event name
                fc.object(), // Data
                fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }), // Rooms
                async (event, data, rooms) => {
                    jest.clearAllMocks();
                    emitToRooms(event, data, rooms);

                    expect(mockTo).toHaveBeenCalledTimes(rooms.length);
                    rooms.forEach(room => {
                        expect(mockTo).toHaveBeenCalledWith(room);
                    });
                    expect(mockEmit).toHaveBeenCalledTimes(rooms.length);
                    expect(mockEmit).toHaveBeenCalledWith(event, data);
                }
            ),
            { numRuns: 50 }
        );
    });
});
