import mongoose from "mongoose";
import Follow from "../models/followModel.js";
import User from "../models/userModel.js";
import Developer from "../models/developerModel.js";
import { AppError } from "../errors/appError.js";
import { NotFoundError } from "../errors/index.js";

const { Types } = mongoose;

/**
* Establishes a following relationship between a user and a developer.
* @param {Object} followData - Following relationship data
* @param {string|ObjectId} followData.userId - Valid ID of the following user (must exist)
* @param {string|ObjectId} followData.developerId - Valid ID of the developer to follow (must exist)
* @returns {Promise<Object>} The created follow document
* @throws {AppError} With status 400 if:
*   - userId is missing or invalid
*   - developerId is missing or invalid
*   - Data validation fails (Mongoose ValidationError)
* @throws {NotFoundError} If referenced user or developer doesn't exist
* @throws {AppError} With status 409 if the follow relationship already exists (duplicate key error)
* @throws {AppError} With status 500 for unexpected server errors
* @description
*   - Performs strict input validation on both IDs
*   - Verifies existence of both user and developer
*   - Prevents duplicate follows through unique indexing
*   - Handles specific database errors appropriately
*   - Returns the complete follow document upon success
*/
export const followDeveloper = async ({ userId, developerId }) => {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }
    if (!developerId || !Types.ObjectId.isValid(developerId)) {
      throw new AppError("Invalid developer ID", 400);
    }
  
    try {
      const [userExists, devExists] = await Promise.all([
        User.exists({ _id: userId }),
        Developer.exists({ _id: developerId }),
      ]);
      if (!userExists) throw new NotFoundError("User not found");
      if (!devExists)  throw new NotFoundError("Developer not found");
  
      const follow = await Follow.create({
        user_id: userId,
        developer_id: developerId,
      });
      return follow;
  
    } catch (err) {
      // Duplicado por índice único
      if (err.code === 11000) {
        throw new AppError("Already following this developer", 409);
      }
      if (err.name === "ValidationError") {
        throw new AppError(`Validation failed: ${err.message}`, 400, null, err);
      }
      if (err instanceof AppError) {
        throw err;
      }
      console.error("[followDeveloper] Unexpected error:", err);
      throw new AppError("Failed to follow developer", 500, null, err);
    }
  };

  /**
* Removes a following relationship between a user and a developer.
* @param {Object} unfollowData - Unfollow operation data
* @param {string|ObjectId} unfollowData.userId - Valid ID of the user
* @param {string|ObjectId} unfollowData.developerId - Valid ID of the developer
* @returns {Promise<Object>} Success message object
* @throws {AppError} With status 400 if:
*   - userId is missing or invalid
*   - developerId is missing or invalid
*   - Invalid ObjectId format (CastError)
* @throws {NotFoundError} If no existing follow relationship is found
* @throws {AppError} With status 500 for unexpected server errors
* @description
*   - Validates both user and developer IDs
*   - Deletes the follow relationship if it exists
*   - Returns success message upon deletion
*   - Provides specific error handling for various failure cases
*/
  export const unfollowDeveloper = async ({ userId, developerId }) => {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }
    if (!developerId || !Types.ObjectId.isValid(developerId)) {
      throw new AppError("Invalid developer ID", 400);
    }
  
    try {
      const result = await Follow.findOneAndDelete({ user_id: userId, developer_id: developerId });
      if (!result) {
        throw new NotFoundError("Follow record not found");
      }
      return { message: "Unfollowed successfully" };
  
    } catch (err) {
      if (err.name === "CastError") {
        throw new AppError("Invalid ObjectId format", 400, null, err);
      }
      if (err instanceof AppError) {
        throw err;
      }
      console.error("[unfollowDeveloper] Unexpected error:", err);
      throw new AppError("Failed to unfollow developer", 500, null, err);
    }
  };

  /**
* Retrieves all followers for a specific developer.
* @param {string|ObjectId} developerId - Valid ID of the developer
* @returns {Promise<Array<Object>>} Array of follower objects with populated user data
* @throws {AppError} With status 400 if developerId is missing or invalid
* @throws {NotFoundError} If the specified developer doesn't exist
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates the developer ID format
*   - Verifies developer existence before querying
*   - Returns followers sorted by most recent first
*   - Populates basic user information (name and email)
*   - Returns lean objects for better performance
* @note The returned follower objects include:
*   - Full follow record data
*   - Populated user_id field with name and email
*/
  export const getFollowersForDeveloper = async (developerId) => {
    if (!developerId || !Types.ObjectId.isValid(developerId)) {
      throw new AppError("Invalid developer ID", 400);
    }
  
    try {
      const devExists = await Developer.exists({ _id: developerId });
      if (!devExists) throw new NotFoundError("Developer not found");
  
      const followers = await Follow.find({ developer_id: developerId })
        .populate("user_id", "name email")
        .sort({ date: -1 })
        .lean();
  
      return followers;
  
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      console.error("[getFollowersForDeveloper] Unexpected error:", err);
      throw new AppError("Failed to retrieve followers", 500, null, err);
    }
  };

  /**
* Counts the total number of followers for a specific developer.
* @param {string|ObjectId} developerId - Valid ID of the developer to count followers for
* @returns {Promise<number>} Total count of followers
* @throws {AppError} With status 400 if developerId is missing or invalid
* @throws {NotFoundError} If the specified developer doesn't exist
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates the developer ID format
*   - Verifies developer existence before counting
*   - Uses efficient countDocuments operation
*   - Returns the follower count as a number
* @note This function performs a direct count query without retrieving follower records
*/
  export const countFollowersForDeveloper = async (developerId) => {
    if (!developerId || !Types.ObjectId.isValid(developerId)) {
      throw new AppError("Invalid developer ID", 400);
    }
  
    try {
      const devExists = await Developer.exists({ _id: developerId });
      if (!devExists) throw new NotFoundError("Developer not found");
  
      const count = await Follow.countDocuments({ developer_id: developerId });
      return count;
  
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      console.error("[countFollowersForDeveloper] Unexpected error:", err);
      throw new AppError("Failed to count followers", 500, null, err);
    }
  };
  
  