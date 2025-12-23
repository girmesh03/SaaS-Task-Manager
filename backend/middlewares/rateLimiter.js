import rateLimit from "express-rate-limit";
import { RATE_LIMIT } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Rate Limiting Middleware
 *
 * CRITICAL: Only applied in production
 * Development: No rate limiting
 * Production: 5/15min for auth endpoints, 100/15min for general endpoints
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Rate limiter for authentication endpoints
 * 5 requests per 15 minutes in production
 */
export const authRateLimiter = isProduction
  ? rateLimit({
      windowMs:
        parseInt(process.env.RATE_LIMIT_WINDOW_MS) || RATE_LIMIT.WINDOW_MS,
      max:
        parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) ||
        RATE_LIMIT.AUTH_MAX_REQUESTS,
      message: "Too many authentication attempts, please try again later",
      standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false, // Disable `X-RateLimit-*` headers
      handler: (req, res) => {
        logger.warn({
          message: "Auth rate limit exceeded",
          ip: req.ip,
          path: req.path,
        });

        res.status(429).json({
          success: false,
          statusCode: 429,
          errorCode: "RATE_LIMIT_EXCEEDED",
          message: "Too many authentication attempts, please try again later",
        });
      },
    })
  : (req, res, next) => next(); // No rate limiting in development

/**
 * Rate limiter for general API endpoints
 * 100 requests per 15 minutes in production
 */
export const generalRateLimiter = isProduction
  ? rateLimit({
      windowMs:
        parseInt(process.env.RATE_LIMIT_WINDOW_MS) || RATE_LIMIT.WINDOW_MS,
      max:
        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
        RATE_LIMIT.MAX_REQUESTS,
      message: "Too many requests, please try again later",
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn({
          message: "General rate limit exceeded",
          ip: req.ip,
          path: req.path,
          user: req.user?._id,
        });

        res.status(429).json({
          success: false,
          statusCode: 429,
          errorCode: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later",
        });
      },
    })
  : (req, res, next) => next(); // No rate limiting in development

export default {
  authRateLimiter,
  generalRateLimiter,
};
