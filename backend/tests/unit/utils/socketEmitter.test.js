import { jest } from "@jest/globals";

// Mock socketInstance
const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
const mockIO = { to: mockTo };

jest.unstable_mockModule("../../../utils/socketInstance.js", () => ({
  getIO: jest.fn().mockReturnValue(mockIO),
}));

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  error: jest.fn(),
};
jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

// Import after mocks
const { emitToRooms, emitTaskEvent, emitActivityEvent, emitCommentEvent, emitNotificationEvent } = await import("../../../utils/socketEmitter.js");

describe("socketEmitter - Socket.IO Event Emitters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("emitToRooms", () => {
    test("should emit event to all provided rooms", () => {
      const rooms = ["room1", "room2"];
      const event = "testEvent";
      const data = { foo: "bar" };

      emitToRooms(event, data, rooms);

      expect(mockTo).toHaveBeenCalledTimes(2);
      expect(mockTo).toHaveBeenCalledWith("room1");
      expect(mockTo).toHaveBeenCalledWith("room2");
      expect(mockEmit).toHaveBeenCalledTimes(2);
      expect(mockEmit).toHaveBeenCalledWith(event, data);
    });

    test("should log error if emission fails", () => {
      // Force an error e.g. mockTo throws
      mockTo.mockImplementationOnce(() => { throw new Error("Socket error"); });

      emitToRooms("event", {}, ["room"]);

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to emit"));
    });
  });

  describe("emitTaskEvent", () => {
    test("should emit to department and organization rooms", () => {
      const task = { _id: "task1", department: "dept1", organization: "org1" };
      emitTaskEvent("task:created", task);

      expect(mockTo).toHaveBeenCalledWith("department:dept1");
      expect(mockTo).toHaveBeenCalledWith("organization:org1");
      expect(mockEmit).toHaveBeenCalledWith("task:created", task);
    });
  });

  describe("emitActivityEvent", () => {
    test("should emit to department and organization rooms", () => {
      const activity = { _id: "act1", department: "dept1", organization: "org1" };
      emitActivityEvent("activity:created", activity);

      expect(mockTo).toHaveBeenCalledWith("department:dept1");
      expect(mockTo).toHaveBeenCalledWith("organization:org1");
      expect(mockEmit).toHaveBeenCalledWith("activity:created", activity);
    });
  });

  describe("emitCommentEvent", () => {
    test("should emit to department and organization rooms", () => {
      const comment = { _id: "com1", department: "dept1", organization: "org1" };
      emitCommentEvent("comment:created", comment);

      expect(mockTo).toHaveBeenCalledWith("department:dept1");
      expect(mockTo).toHaveBeenCalledWith("organization:org1");
      expect(mockEmit).toHaveBeenCalledWith("comment:created", comment);
    });
  });

  describe("emitNotificationEvent", () => {
    test("should emit to user room", () => {
      const notification = { _id: "notif1", recipient: "user123" };
      emitNotificationEvent("notification:created", notification);

      expect(mockTo).toHaveBeenCalledWith("user:user123");
      expect(mockEmit).toHaveBeenCalledWith("notification:created", notification);
    });
  });
});
