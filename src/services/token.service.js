import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import User from "../models/userModel.js";
import {
  TokenVerificationError,
  TokenExpiredError,
  TokenGenerationError,
  CookieSettingError,
} from "../errors/index.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

/**
 * Generates a secure JWT access token
 * @param {Object} user - User object containing at least _id and role
 * @param {string} user._id - MongoDB user ID
 * @param {string} user.role - User role
 * @returns {string} JWT access token
 * @throws {TokenGenerationError} If token generation fails
 */
export const generateAccessToken = async (user) => {
  try {
    if (!user?._id || !user?.role) {
      throw new Error("Invalid user object - missing required properties");
    }

    if (!config.jwtSecretKey) {
      throw new Error("JWT secret key not configured");
    }

    const payload = {
      id: user._id,
      role: user.role,
      // Add standard claims for better security
      iss: config.jwtIssuer || "meme-coins-filter-dev",
      aud: config.jwtAudience || "meme-coins-filter-dev-app",
      iat: Math.floor(Date.now() / 1000),
    };

    const options = {
      expiresIn: "15m",
      algorithm: "HS256",
    };

    return jwt.sign(payload, config.jwtSecretKey, options);
  } catch (error) {
    console.error("Token generation failed:", error);
    throw new TokenGenerationError(
      `Failed to generate access token: ${error.message}`
    );
  }
};

/**
 * Generates a secure JWT refresh token
 * @param {Object} user - User object containing at least _id
 * @param {string|ObjectId} user._id - User's unique identifier
 * @param {string} [user.tokenVersion=0] - Token version for invalidation
 * @returns {string} JWT refresh token
 * @throws {TokenGenerationError} If token generation fails
 */
export const generateRefreshToken = async (user) => {
  try {
    if (!user?._id || !user?.role) {
      throw new Error("Invalid user object - missing required properties");
    }

    if (!config.jwtRefreshKey) {
      throw new Error("JWT refresh key not configured");
    }

    if (config.jwtRefreshKey === config.jwtSecretKey) {
      throw new Error("Refresh token key must differ from access token key");
    }

    if (!(user instanceof User)) {
      user = await User.findById(user._id); 
      if (!user) {
        throw new Error("User not found");
      }
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await User.findByIdAndUpdate(user._id, { tokenVersion: user.tokenVersion });

    const options = {
      expiresIn: "7d", // Expira en 7 días 
    };

    const payload = {
      id: user._id,
      version: user.tokenVersion,
      iss: config.jwtIssuer || "meme-coins-filter-dev-app",
      aud: "refresh",
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, config.jwtRefreshKey, options);
    return token;
  } catch (error) {
    console.error("Refresh token generation failed:", error);
    throw new TokenGenerationError(
      `Failed to generate refresh token: ${error.message}`
    );
  }
};


/**
 * Sets the refresh token as an HTTP-only cookie with enhanced security
 * @param {Object} res - Express response object
 * @param {string} refreshToken - JWT refresh token
 * @throws {CookieSettingError} If cookie setting fails
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
  try {
    if (!res?.cookie) {
      throw new Error("Invalid response object");
    }

    if (!refreshToken || typeof refreshToken !== "string") {
      throw new Error("Invalid refresh token");
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "Strict" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth/refresh", // Restrict to refresh endpoint
      domain: cookieDomain,
      // signed: !!process.env.COOKIE_SECRET,
    };

    // Additional security headers
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      ...(isProduction && {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      }),
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);
  } catch (error) {
    console.error("Failed to set refresh token cookie:", error);
    throw new CookieSettingError(`Cookie setting failed: ${error.message}`);
  }
};

/**
 * Refreshes an access token using a valid refresh token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Promise<string>} New access token
 * @throws {TokenVerificationError|TokenExpiredError} On token validation failure
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Validate input
    if (!refreshToken) {
      throw new TokenVerificationError(
        "No refresh token provided",
        "MISSING_TOKEN"
      );
    }

    // Verify token structure before decoding
    if (
      typeof refreshToken !== "string" ||
      !refreshToken.split(".").length == 3
    ) {
      throw new TokenVerificationError(
        "Invalid token format",
        "INVALID_FORMAT"
      );
    }

    // Verify and decode token
    const decoded = jwt.verify(refreshToken, config.jwtRefreshKey, {
      algorithms: ["HS256"],
      ignoreExpiration: false,
    });

    // Find user with refresh token
    const user = await User.findById(decoded.id).select(
      "+refreshToken +tokenVersion"
    );
    if (!user) {
      throw new TokenVerificationError("User not found", "USER_NOT_FOUND");
    }

    // Validate token against stored token and version
    if (user.refreshToken !== refreshToken) {
      logSecurityEvent("refresh_token_mismatch", { userId: decoded.id });
      throw new TokenVerificationError(
        "Token does not match stored token",
        "TOKEN_MISMATCH"
      );
    }

    if (decoded.version !== user.tokenVersion) {
      logSecurityEvent("refresh_token_version_mismatch", {
        userId: decoded.id,
      });
      throw new TokenVerificationError(
        "Token version invalid",
        "VERSION_MISMATCH"
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Log successful refresh
    logSecurityEvent("token_refreshed", { userId: user._id });

    return newAccessToken;
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent("refresh_token_expired", { error: error.message });
      throw new TokenExpiredError("Refresh token expired", "TOKEN_EXPIRED");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent("invalid_refresh_token", { error: error.message });
      throw new TokenVerificationError(
        "Invalid refresh token",
        "INVALID_TOKEN"
      );
    }

    if (
      error instanceof TokenVerificationError ||
      error instanceof TokenExpiredError
    ) {
      throw error;
    }

    // Log and wrap unexpected errors
    logSecurityEvent("refresh_token_error", { error: error.message });
    throw new TokenVerificationError(
      "Failed to refresh token",
      "INTERNAL_ERROR"
    );
  }
};
