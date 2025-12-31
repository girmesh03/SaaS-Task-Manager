import { jest } from "@jest/globals";

const mockTransporter = {
  sendMail: jest.fn(),
};

const mockNodemailer = {
  createTransport: jest.fn(() => mockTransporter),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.unstable_mockModule("nodemailer", () => ({
  default: mockNodemailer,
  ...mockNodemailer,
}));

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

// fs mocks removed to rely on real template files


// We must bypass the internal createTransporter if we want to test theexported functions easily
// or just mock the whole module. But sendEmail calls createTransporter internally.
// So mocking nodemailer.createTransporter is enough.

const {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendMentionEmail,
  sendTaskNotificationEmail
} = await import("../../../services/emailService.js");

describe("emailService", () => {
  const user = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    organization: { name: "Org 1" },
    department: { name: "Dept 1" },
    role: "User",
    emailPreferences: {
        mentions: true,
        taskNotifications: true,
    }
  };

  beforeAll(() => {
    process.env.EMAIL_FROM = "noreply@example.com";
    process.env.CLIENT_URL = "http://localhost:3000";
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });
  });

  test("sendEmail should call transporter.sendMail with correct options", async () => {
    await sendEmail("test@example.com", "Subject", "<p>Hello</p>");

    expect(mockNodemailer.createTransport).toHaveBeenCalled();
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "test@example.com",
      subject: "Subject",
      html: "<p>Hello</p>",
    });
    expect(mockLogger.info).toHaveBeenCalledWith(expect.objectContaining({
      message: "Email sent successfully",
      to: "test@example.com"
    }));
  });

  test("sendEmail should log error but not throw on failure", async () => {
    const error = new Error("SMTP Error");
    mockTransporter.sendMail.mockRejectedValue(error);

    await expect(sendEmail("test@example.com", "Sub", "HTML")).resolves.not.toThrow();

    expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
      message: "Failed to send email",
      error: "SMTP Error"
    }));
  });

  test("sendWelcomeEmail should send correct content", async () => {
    await sendWelcomeEmail(user);

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      subject: "Welcome to Task Manager Pro",
      html: expect.stringContaining("Hello John,")
    }));
  });

  test("sendPasswordResetEmail should include reset token", async () => {
    const token = "reset-token-123";
    await sendPasswordResetEmail(user, token);

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining("token=reset-token-123")
    }));
  });

  test("sendPasswordResetConfirmation should send success email", async () => {
    await sendPasswordResetConfirmation(user);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: "Password Updated Successfully"
    }));
  });

  test("sendMentionEmail should respect user preferences", async () => {
    const actor = { firstName: "Jane", lastName: "Smith" };
    const comment = { comment: "Hello @John", createdBy: actor };
    const task = { _id: "task1", title: "Test Task" };

    // Case 1: Preferences enabled
    await sendMentionEmail(user, actor, comment, task);
    expect(mockTransporter.sendMail).toHaveBeenCalled();

    // Case 2: Preferences disabled
    mockTransporter.sendMail.mockClear();
    const userNoEmail = { ...user, emailPreferences: { mentions: false } };
    await sendMentionEmail(userNoEmail, actor, comment, task);
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });

  test("sendTaskNotificationEmail should handle different actions", async () => {
    const task = { _id: "t1", title: "Title", status: "Open", priority: "Low" };

    await sendTaskNotificationEmail(user, task, "created");
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        subject: "New Task Created"
    }));

    await sendTaskNotificationEmail(user, task, "assigned");
    expect(mockTransporter.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
        subject: "Task Assigned to You"
    }));

    await sendTaskNotificationEmail(user, task, "updated");
    expect(mockTransporter.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
        subject: "Task Updated"
    }));

    await sendTaskNotificationEmail(user, task, "unknown");
    expect(mockTransporter.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
        subject: "Task Notification"
    }));
  });

  test("sendTaskNotificationEmail should handle missing title and dueDate", async () => {
    const taskMin = { _id: "t2", description: "Desc only", status: "Done", priority: "High" };
    await sendTaskNotificationEmail(user, taskMin, "created");

    expect(mockTransporter.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
        html: expect.stringContaining("Desc only")
    }));
    // Note: The template might just have an empty string or "undefined" if not handled,
    // but the service code: dueDateText = task.dueDate ? ... : ""
    // So "Due Date:" string should NOT be present.
    expect(mockTransporter.sendMail).toHaveBeenLastCalledWith(expect.not.objectContaining({
        html: expect.stringContaining("Due Date:")
    }));

    const taskWithDate = { ...taskMin, dueDate: new Date() };
    await sendTaskNotificationEmail(user, taskWithDate, "created");
    expect(mockTransporter.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
        html: expect.stringContaining("Due Date:")
    }));
  });

  test("sendTaskNotificationEmail should respect preferences", async () => {
    const task = { _id: "t1" };
    const userNoNotif = { ...user, emailPreferences: { taskNotifications: false } };

    await sendTaskNotificationEmail(userNoNotif, task, "updated");
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });
});
