import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

/**
 * Email Service with Nodemailer and Gmail SMTP
 *
 * Queue-based email sending (async)
 * Errors logged but not thrown to prevent blocking
 */

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // App-specific password
    },
  });
};

/**
 * Send email (async, non-blocking)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<void>}
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    // Send email asynchronously
    const info = await transporter.sendMail(mailOptions);

    logger.info({
      message: "Email sent successfully",
      to,
      subject,
      messageId: info.messageId,
    });
  } catch (error) {
    // Log error but don't throw (non-blocking)
    logger.error({
      message: "Failed to send email",
      to,
      subject,
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Send welcome email to new user
 * @param {object} user - User object
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (user) => {
  const subject = "Welcome to Task Manager";
  const html = `
    <h1>Welcome to Task Manager, ${user.firstName}!</h1>
    <p>Your account has been created successfully.</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Organization:</strong> ${user.organization.name}</p>
    <p><strong>Department:</strong> ${user.department.name}</p>
    <p><strong>Role:</strong> ${user.role}</p>
    <br>
    <p>You can now login to your account and start managing tasks.</p>
    <p>If you have any questions, please contact your administrator.</p>
    <br>
    <p>Best regards,<br>Task Manager Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send password reset email
 * @param {object} user - User object
 * @param {string} resetToken - Password reset token (unhashed)
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const subject = "Password Reset Request";
  const html = `
    <h1>Password Reset Request</h1>
    <p>Hello ${user.firstName},</p>
    <p>You requested to reset your password. Click the link below to reset your password:</p>
    <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>Or copy and paste this link in your browser:</p>
    <p>${resetUrl}</p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    <br>
    <p>Best regards,<br>Task Manager Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send password reset confirmation email
 * @param {object} user - User object
 * @returns {Promise<void>}
 */
export const sendPasswordResetConfirmation = async (user) => {
  const subject = "Password Reset Successful";
  const html = `
    <h1>Password Reset Successful</h1>
    <p>Hello ${user.firstName},</p>
    <p>Your password has been successfully reset.</p>
    <p>If you didn't make this change, please contact your administrator immediately.</p>
    <br>
    <p><strong>Security Notice:</strong> For your security, we recommend:</p>
    <ul>
      <li>Using a strong, unique password</li>
      <li>Not sharing your password with anyone</li>
      <li>Changing your password regularly</li>
    </ul>
    <br>
    <p>Best regards,<br>Task Manager Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send mention notification email
 * @param {object} user - Mentioned user
 * @param {object} comment - Comment object
 * @param {object} task - Task object
 * @returns {Promise<void>}
 */
export const sendMentionEmail = async (user, comment, task) => {
  // Check if user has email preferences enabled
  if (!user.emailPreferences?.mentions) {
    return;
  }

  const taskUrl = `${process.env.CLIENT_URL}/tasks/${task._id}`;

  const subject = "You were mentioned in a comment";
  const html = `
    <h1>You were mentioned in a comment</h1>
    <p>Hello ${user.firstName},</p>
    <p><strong>${comment.createdBy.firstName} ${
    comment.createdBy.lastName
  }</strong> mentioned you in a comment:</p>
    <blockquote style="border-left: 4px solid #007bff; padding-left: 15px; margin: 20px 0; color: #555;">
      ${comment.comment}
    </blockquote>
    <p><strong>Task:</strong> ${task.title || task.description}</p>
    <p><a href="${taskUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Task</a></p>
    <br>
    <p>Best regards,<br>Task Manager Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send task notification email
 * @param {object} user - User to notify
 * @param {object} task - Task object
 * @param {string} action - Action type (created, updated, assigned)
 * @returns {Promise<void>}
 */
export const sendTaskNotificationEmail = async (user, task, action) => {
  // Check if user has email preferences enabled
  if (!user.emailPreferences?.taskNotifications) {
    return;
  }

  const taskUrl = `${process.env.CLIENT_URL}/tasks/${task._id}`;

  let subject = "";
  let content = "";

  switch (action) {
    case "created":
      subject = "New Task Created";
      content = `<p>A new task has been created:</p>`;
      break;
    case "updated":
      subject = "Task Updated";
      content = `<p>A task has been updated:</p>`;
      break;
    case "assigned":
      subject = "Task Assigned to You";
      content = `<p>A task has been assigned to you:</p>`;
      break;
    default:
      subject = "Task Notification";
      content = `<p>Task notification:</p>`;
  }

  const html = `
    <h1>${subject}</h1>
    <p>Hello ${user.firstName},</p>
    ${content}
    <p><strong>Task:</strong> ${task.title || task.description}</p>
    <p><strong>Status:</strong> ${task.status}</p>
    <p><strong>Priority:</strong> ${task.priority}</p>
    ${
      task.dueDate
        ? `<p><strong>Due Date:</strong> ${new Date(
            task.dueDate
          ).toLocaleDateString()}</p>`
        : ""
    }
    <p><a href="${taskUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Task</a></p>
    <br>
    <p>Best regards,<br>Task Manager Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendMentionEmail,
  sendTaskNotificationEmail,
};
