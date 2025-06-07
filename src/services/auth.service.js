import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} from "../services/token.service.js";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import {
  AuthenticationError,
  AccountLockedError,
  UserRegistrationError,
} from "../errors/index.js";
import validator from "validator";
import { generateUniqueAccessCode } from "../utils/generateCode.js";

/**
 * Registers a new user with comprehensive validation and security
 * @param {string} name - User's full name
 * @param {string} email - Valid email address
 * @param {string} password - Strong password
 * @param {string} passwordConfirmed - Password confirmation
 * @param {string} [role="USER"] - User role (ADMIN, USER, DEVELOPER)
 * @returns {Promise<Object>} The created user object (without sensitive fields)
 * @throws {UserRegistrationError} If registration fails
 */
export const registerUser = async (
  name,
  email,
  phone,
  password,
  passwordConfirmed,
  role = "USER"
) => {
  try {
    if (!name?.trim() || !email?.trim() || !password || !passwordConfirmed) {
      throw new Error("All fields are required");
    }

    if (!validator.isEmail(email)) {
      throw new Error("Invalid email address");
    }

     const trimmedPhone = phone.trim();
    const phoneRegex = /^\d{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      throw new Error(
        "El teléfono debe contener exactamente 8 dígitos numéricos"
      );
    }

    if (password !== passwordConfirmed) {
      throw new Error("Passwords do not match");
    }

    if (!isValidPassword(password)) {
      throw new Error(
        "Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character"
      );
    }

    const existingUser = await User.exists({ email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await hashPassword(password);
    const accessCode = await generateUniqueAccessCode();

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: trimmedPhone,
      password: hashedPassword,
      role: role.toUpperCase(),
      access_code: accessCode,
      is_active: true,
    });

    return user;
  } catch (error) {
    console.error("User registration error:", error);
    throw new UserRegistrationError(
      error.message || "User registration failed"
    );
  }
};

/**
 * Validates password strength
 * @param {string} password - User's password
 * @returns {boolean} Whether the password is strong
 */
const isValidPassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Hashes a password securely
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Authenticates a user and generates tokens
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {Object} res - Express response object
 * @returns {Promise<string>} Access token
 * @throws {AuthenticationError|AccountLockedError} On authentication failure
 */
export const loginUser = async (email, password, res) => {
  try {
    if (!email || !password) {
      throw new AuthenticationError("Email and password are required");
    }

    const user = await User.findOne({ email })
      .select("+password +refreshToken +loginAttempts +isLocked +lockUntil")
      .lean();

    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    if (user.isLocked && user.lockUntil > Date.now()) {
      throw new AccountLockedError(
        "Account temporarily locked due to multiple failed attempts"
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const loginAttempts = user.loginAttempts + 1;
      const isLocked = loginAttempts >= 5;
      const lockUntil = isLocked ? Date.now() + 30 * 60 * 1000 : null;

      await User.findByIdAndUpdate(user._id, {
        $set: { isLocked, lockUntil },
        $inc: { loginAttempts: 1 },
      });

      throw new AuthenticationError("Invalid credentials");
    }

    // Restablecer intentos fallidos tras un inicio de sesión exitoso
    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      isLocked: false,
      lockUntil: null,
      lastLogin: new Date(),
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    setRefreshTokenCookie(res, refreshToken);

    console.log(`User ${user.email} logged in at ${new Date()}`);

    return accessToken;
  } catch (error) {
    console.error("Login failed:", error);

    if (
      error instanceof AuthenticationError ||
      error instanceof AccountLockedError
    ) {
      throw error;
    }

    throw new AuthenticationError("An unexpected error occurred during login");
  }
};

/**
 * Logs out a user by clearing their refresh token in the database and deleting authentication cookies.
 *
 * @param {Response} res - Express response object, used to clear cookies.
 * @param {Object} user - The user object from the database, which contains the refresh token.
 * @throws {Error} Throws an error if the logout process fails.
 */
export const logoutUser = async (res, user) => {
  try {
    if (user) {
      console.log(user);
      await user.updateOne({ $set: { refreshToken: null } });

      const updatedUser = await user.model("User").findById(user._id);
      console.log("Updated user refreshToken:", updatedUser.refreshToken);
    }

    const cookieOptions = { httpOnly: true, sameSite: "Strict" };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    // Remove authentication cookies
    res.cookie("refreshToken", "", { ...cookieOptions, expires: new Date(0) });
    res.cookie("jwt", "", { ...cookieOptions, expires: new Date(0) });

    console.log("User logged out successfully.");
  } catch (error) {
    console.error("Error during logout:", error.message);
    throw new Error("Logout failed.");
  }
};

