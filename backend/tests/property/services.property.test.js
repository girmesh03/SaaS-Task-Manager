import { jest } from "@jest/globals";
import fc from "fast-check";

const mockNotification = {
  create: jest.fn(),
};

const mockLogger = {
  error: jest.fn(),
};

jest.unstable_mockModule("../../models/Notification.js", () => ({
  default: mockNotification
}));

jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: mockLogger,
}));

const { notifyTaskCreated } = await import("../../services/notificationService.js");

describe("notificationService Property-Based Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Property 13/14: Notification Creation Consistency", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }), // recipients
        async (recipients) => {
          jest.clearAllMocks();
          mockNotification.create.mockImplementation(([data]) => Promise.resolve([data]));

          const task = { _id: "t1", title: "Task", taskType: "ProjectTask", organization: "org1" };

          const results = await notifyTaskCreated(task, recipients);

          expect(results).toHaveLength(recipients.length);
          expect(mockNotification.create).toHaveBeenCalledTimes(recipients.length);

          results.forEach((res, idx) => {
            expect(res.recipient).toBe(recipients[idx]);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
