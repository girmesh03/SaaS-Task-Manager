import { jest } from "@jest/globals";

const mockNotification = {
  create: jest.fn(),
};

const mockLogger = {
  error: jest.fn(),
};

jest.unstable_mockModule("../../../models/Notification.js", () => ({
  default: mockNotification
}));

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

const {
  createNotification,
  notifyTaskCreated,
  notifyMention
} = await import("../../../services/notificationService.js");
const { NOTIFICATION_TYPES } = await import("../../../utils/constants.js");

describe("notificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNotification", () => {
    test("should create notification and return the first element", async () => {
      const data = { title: "Test" };
      mockNotification.create.mockResolvedValue([data]);

      const result = await createNotification(data);

      expect(mockNotification.create).toHaveBeenCalledWith([data], { session: undefined });
      expect(result).toEqual(data);
    });

    test("should log and throw error on failure", async () => {
      const error = new Error("DB Error");
      mockNotification.create.mockRejectedValue(error);

      await expect(createNotification({ title: "Fail" })).rejects.toThrow("DB Error");
      expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
        message: "Failed to create notification"
      }));
    });
  });

  describe("notifyTaskCreated", () => {
    test("should create notifications for each recipient", async () => {
      mockNotification.create.mockImplementation(([data]) => Promise.resolve([data]));

      const task = { _id: "t1", title: "Task 1", taskType: "ProjectTask", organization: "org1" };
      const recipients = ["u1", "u2"];

      const results = await notifyTaskCreated(task, recipients);

      expect(results).toHaveLength(2);
      expect(mockNotification.create).toHaveBeenCalledTimes(2);
      expect(results[0].recipient).toBe("u1");
      expect(results[1].recipient).toBe("u2");
      expect(results[0].type).toBe(NOTIFICATION_TYPES.CREATED);
    });

    test("should use description if title is missing", async () => {
        mockNotification.create.mockImplementation(([data]) => Promise.resolve([data]));
        const task = { _id: "t2", description: "Only Desc", taskType: "RoutineTask" };
        const results = await notifyTaskCreated(task, ["u1"]);
        expect(results[0].message).toContain("Only Desc");
    });
  });

  describe("notifyMention", () => {
    test("should create notifications for mentioned users", async () => {
      mockNotification.create.mockImplementation(([data]) => Promise.resolve([data]));

      const comment = {
        _id: "c1",
        createdBy: { firstName: "Jane", lastName: "S" },
        organization: "org1"
      };
      const mentionedUsers = ["u3"];

      const results = await notifyMention(comment, mentionedUsers);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("You were mentioned");
      expect(results[0].recipient).toBe("u3");
      expect(results[0].type).toBe(NOTIFICATION_TYPES.MENTION);
    });
  });
});
