/**
 * CORS Allowed Origins List
 *
 * Development: localhost ports for frontend dev servers
 * Production: CLIENT_URL from environment variables
 */

const allowedOrigins = [
  "http://localhost:3000", // React dev server (default)
  "http://localhost:5173", // Vite dev server
];

// Add production origins from environment variables
if (process.env.NODE_ENV === "production") {
  if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  // Add additional allowed origins from comma-separated list
  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",").map(
      (origin) => origin.trim()
    );
    allowedOrigins.push(...additionalOrigins);
  }
}

export default allowedOrigins;
