import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Service with Nodemailer and Gmail SMTP
 *
 * Uses HTML templates from ../templates/
 */

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Load and compile template
 * @param {string} templateName - Name of template file
 * @param {object} data - Object with replacement variables
 * @returns {string} Compiled HTML
 */
const loadTemplate = (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, "..", "templates", `${templateName}.html`);
    let html = fs.readFileSync(templatePath, "utf8");

    // Add global variables
    const templateData = {
      ...data,
      year: new Date().getFullYear(),
      clientUrl: process.env.CLIENT_URL,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    };

    // Simple string replacement for {{variable}}
    Object.keys(templateData).forEach((key) => {
      const value = templateData[key] || "";
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, value);
    });

    return html;
  } catch (error) {
    logger.error({
      message: `Failed to load email template: ${templateName}`,
      error: error.message,
    });
    return "";
  }
};

/**
 * Send email (async, non-blocking)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<void>}
 */
export const sendEmail = async (to, subject, html) => {
  if (!html) {
    logger.error({ message: "Empty HTML content, aborting email send", to, subject });
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info({
      message: "Email sent successfully",
      to,
      subject,
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error({
      message: "Failed to send email",
      to,
      subject,
      error: error.message,
    });
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (user) => {
  const subject = "Welcome to Task Manager Pro";
  const html = loadTemplate("welcome", {
    firstName: user.firstName,
    organization: user.organization.name || "N/A",
    department: user.department.name || "N/A",
    role: user.role,
  });

  await sendEmail(user.email, subject, html);
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (user, token) => {
  const subject = "Verify Your Email - Task Manager Pro";
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  // Reuse layout or simple template
  const html = `
    <h1>Verify Your Email</h1>
    <p>Hello ${user.firstName},</p>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const subject = "Password Reset Request";
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = loadTemplate("passwordReset", {
    firstName: user.firstName,
    resetUrl,
  });

  await sendEmail(user.email, subject, html);
};

/**
 * Send password reset confirmation email
 */
export const sendPasswordResetConfirmation = async (user) => {
  const subject = "Password Updated Successfully";
  const html = loadTemplate("passwordResetConfirmation", {
    firstName: user.firstName,
  });

  await sendEmail(user.email, subject, html);
};

/**
 * Send mention notification email
 */
export const sendMentionEmail = async (user, actor, comment, task) => {
  // Check preferences (assuming user object has emailPreferences)
  if (user.emailPreferences && user.emailPreferences.mentions === false) return;

  const subject = "You were mentioned in a comment";
  const html = loadTemplate("taskMention", {
    firstName: user.firstName,
    actorName: `${actor.firstName} ${actor.lastName}`,
    comment: comment.comment,
    taskTitle: task.title || task.description,
    taskUrl: `${process.env.CLIENT_URL}/tasks/${task._id}`,
  });

  await sendEmail(user.email, subject, html);
};

/**
 * Send task notification email (created, updated, assigned)
 */
export const sendTaskNotificationEmail = async (user, task, action) => {
  if (user.emailPreferences && user.emailPreferences.taskNotifications === false) return;

  let actionMessage = "";
  let subject = "";

  switch (action) {
    case "created":
      subject = "New Task Created";
      actionMessage = "A new task has been created for your attention.";
      break;
    case "updated":
      subject = "Task Updated";
      actionMessage = "A task you are watching has been updated.";
      break;
    case "assigned":
      subject = "Task Assigned to You";
      actionMessage = "A new task has been assigned to you.";
      break;
    default:
      subject = "Task Notification";
      actionMessage = "There is an update on a task.";
  }

  const dueDateText = task.dueDate
    ? `<p style="margin: 15px 0 0 0; font-size: 14px;"><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>`
    : "";

  const html = loadTemplate("taskNotification", {
    firstName: user.firstName,
    actionMessage,
    taskTitle: task.title || task.description,
    taskDescription: task.description || "",
    status: task.status,
    priority: task.priority,
    dueDateText,
    taskUrl: `${process.env.CLIENT_URL}/tasks/${task._id}`,
  });

  await sendEmail(user.email, subject, html);
};

/**
 * Send task assignment email (specific wrapper for notification)
 */
export const sendTaskAssignmentEmail = async (user, task) => {
  await sendTaskNotificationEmail(user, task, "assigned");
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendMentionEmail,
  sendTaskNotificationEmail,
  sendTaskAssignmentEmail,
};
