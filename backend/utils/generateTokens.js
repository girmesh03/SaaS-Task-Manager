import jwt from "jsonwebtoken";
import { JWT } from "./constants.js";

/**
 * JWT Token Generation Functions
 */

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @returns {string} JWT access token
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || JWT.ACCESS_EXPIRES_IN,
  });
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || JWT.REFRESH_EXPIRES_IN,
  });
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @returns {object} Object with accessToken and refreshToken
 */
export const generateTokens = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Set JWT tokens as HTTP-only cookies
 * @param {object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Access token cookie
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: JWT.COOKIE_MAX_AGE.ACCESS,
  });

  // Refresh token cookie
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: JWT.COOKIE_MAX_AGE.REFRESH,
  });
};

/**
 * Clear JWT token cookies
 * @param {object} res - Express response object
 */
export const clearTokenCookies = (res) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
};
