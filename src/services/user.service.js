import User from "../models/userModel.js";
import { NotFoundError } from "../errors/index.js";
import path from "path";
import fs from "fs";

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
    // para debugin
    //   console.error("❌ Error updating profile image:", error); // Esto ya lo tenías
    // throw error;
  }
};

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
