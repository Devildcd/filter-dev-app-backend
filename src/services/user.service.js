import User from "../models/userModel.js";
import { NotFoundError } from "../errors/index.js";
import path from "path";
import fs from "fs";

/**
 * Retrieves a paginated list of all users with sensitive fields excluded.
 * @param {number} [page=1] - The page number to retrieve (1-based index)
 * @param {number} [limit=10] - The number of users per page
 * @returns {Promise<Object>} An object containing:
 *   - users {Array<Object>} - List of user objects (without password and refreshToken)
 *   - totalUsers {number} - Total count of users in the database
 *   - totalPages {number} - Total number of available pages
 *   - currentPage {number} - The current page number
 * @throws {Error} If there's a database error while fetching users
 */
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password -refreshToken")
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsers = await User.countDocuments();

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users,
      totalUsers,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to retrieve users");
  }
};

/**
 * Retrieves the authenticated user by ID.
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<Object>} The user object without sensitive fields.
 * @throws {Error} If the user is not found or there is a database error.
 */
export const getAuthenticatedUser = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password -refreshToken").lean();

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error retrieving user:", error);
    throw new Error("Failed to retrieve user");
  }
};

/**
 * Updates a user's information with field validation and sanitization.
 * @param {string|ObjectId} userId - The ID of the user to update
 * @param {Object} updateData - Data containing fields to update
 * @param {string} [updateData.name] - User's full name
 * @param {string} [updateData.email] - User's email address
 * @param {string} [updateData.profileImage] - URL to user's profile image
 * @returns {Promise<Object>} The updated user document (without sensitive fields)
 * @throws {Error} When:
 *   - No valid updatable fields are provided
 *   - Database validation fails
 * @throws {NotFoundError} If user with given ID doesn't exist
 */
export const updateUser = async (userId, updateData) => {
  try {
    const allowedFields = ["name", "email", "profileImage"];
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    })
      .select("-password -refreshToken")
      .lean();

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

/**
 * Updates a user's profile image and handles old image cleanup.
 * @param {string|ObjectId} userId - The ID of the user to update
 * @param {string} imagePath - The path to the new profile image (required)
 * @returns {Promise<Object>} The updated user object without sensitive fields
 * @throws {BadRequestError} If imagePath is not provided
 * @throws {NotFoundError} If user with given ID doesn't exist
 * @throws {Error} If there's a failure during the update process
 * @description This function will:
 *   - Validate the imagePath is provided
 *   - Check if user exists
 *   - Delete the old profile image if it exists
 *   - Update with the new image path
 *   - Return the user data without password and refreshToken
 */
export const updateProfileImage = async (userId, imagePath) => {
  try {
    if (!imagePath) {
      throw new BadRequestError("Image path is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.profileImage) {
      const oldImagePath = path.resolve(
        "uploads",
        "images",
        path.basename(user.profileImage)
      );
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.warn(`Failed to delete old profile image: ${err.message}`);
        }
      }
    }

    user.profileImage = imagePath;
    await user.save();

    const { password, refreshToken, ...safeUser } = user.toObject();
    return safeUser;
  } catch (error) {
    console.error("Error updating profile image:", error);
    throw new Error("Failed to update profile image");
  }
};

/**
 * Deletes a user and optionally removes their associated profile image.
 * @param {string|ObjectId} userId - The ID of the user to delete
 * @returns {Promise<Object>} An object with a success message: `{ message: string }`
 * @throws {NotFoundError} If no user exists with the provided ID
 * @throws {Error} If there's a database error or file system error during deletion
 * @description This function will:
 *   - Delete the user from the database
 *   - Optionally remove the associated profile image file if it exists
 *   - Return a success message upon completion
 */
export const deleteUser = async (userId) => {
  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Opcional: eliminar imagen de perfil asociada
    if (user.profileImage) {
      const imagePath = path.resolve(
        "uploads",
        "images",
        path.basename(user.profileImage)
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    return { message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};
