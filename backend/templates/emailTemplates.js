/**
 * HTML Email Templates
 *
 * Consistent branding and responsive design
 */

const baseStyle = `
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
`;

export const welcomeEmailTemplate = (user) => `
  <!DOCTYPE html>
  <html>
  <head>${baseStyle}</head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Task Manager!</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName}!</h2>
        <p>Your account has been created successfully.</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Organization:</strong> ${user.organization.name}</p>
        <p><strong>Department:</strong> ${user.department.name}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p>You can now login and start managing tasks.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Task Manager. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

export const passwordResetTemplate = (user, resetUrl) => `
  <!DOCTYPE html>
  <html>
  <head>${baseStyle}</head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName}!</h2>
        <p>You requested to reset your password.</p>
        <p><a href="${resetUrl}" class="button">Reset Password</a></p>
        <p>Or copy this link: ${resetUrl}</p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Task Manager. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

export default {
  welcomeEmailTemplate,
  passwordResetTemplate,
};
