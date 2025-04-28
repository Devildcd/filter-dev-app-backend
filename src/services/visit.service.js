import mongoose from "mongoose";
import Visit from "../models/visitModel.js";
import Developer from "../models/developerModel.js";
import User from "../models/userModel.js";
import { AppError } from "../errors/appError.js";
import { NotFoundError } from "../errors/index.js";
// Desestructuramos Types para validar ObjectId
const { Types } = mongoose;


/**
* Creates a new visit record with comprehensive validation.
* @param {Object} visitData - The visit data to store
* @param {string|ObjectId} visitData.developerId - Required developer ID being visited (must be valid ObjectId)
* @param {string|ObjectId|null} [visitData.userId] - Optional user ID of authenticated visitor (must be valid ObjectId if provided)
* @param {string} visitData.ipAddress - Required IP address string of the visitor
* @returns {Promise<Object>} The created visit document
* @throws {AppError} With status 400 if:
*   - developerId is missing or invalid
*   - userId is provided but invalid
*   - ipAddress is missing, not a string, or empty
*   - Data validation fails (Mongoose ValidationError)
* @throws {NotFoundError} If referenced developer or user doesn't exist
* @throws {AppError} With status 500 for unexpected server errors
* @description
*   - Validates all input parameters strictly
*   - Verifies existence of referenced developer (required)
*   - Verifies existence of user if userId provided (optional)
*   - Trims whitespace from ipAddress
*   - Handles specific database errors (CastError, ValidationError)
*/
export const storeVisit = async ({developerId, userId, ipAddress}) => {
  if (!developerId || !Types.ObjectId.isValid(developerId)) {
    throw new AppError("Invalid developer ID", 400);
  }
  if (userId != null && !Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", 400);
  }
  if (!ipAddress || typeof ipAddress !== "string") {
    throw new AppError("IP address must be a non-empty string", 400);
  }

  try{
    const devExists = await Developer.exists({_id: developerId});
    if (!devExists) {
      throw new NotFoundError("Developer not found");
    }

    if (userId != null) {
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        throw new NotFoundError("User not found");
      }
    }

    const visit = await Visit.create({
      developer_id: developerId,
      user_id: userId,
      ip_address: ipAddress.trim(),
    });
    return visit;
  } catch(err) {
    if (err.name === "ValidationError") {
      throw new AppError(`Validation failed: ${err.message}`, 400, null, err);
    }
    if (err.name === "CastError") {
      throw new AppError("Invalid ObjectId format", 400, null, err);
    }
    if (err instanceof AppError) {
      throw err;
    }
    console.error("[createVisit] Unexpected error:", err);
    throw new AppError("Failed to create visit", 500, null, err);
  }
}


/**
* Counts all visits recorded for a specific developer.
* @param {string|ObjectId} developerId - The ID of the developer to count visits for (must be a valid ObjectId)
* @returns {Promise<number>} The total count of visits for the specified developer
* @throws {AppError} With status 400 if:
*   - developerId is missing or invalid
* @throws {NotFoundError} If the specified developer doesn't exist
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates the developer ID format
*   - Verifies developer existence before counting
*   - Returns the total visit count as a number
*   - Includes comprehensive error handling
*/
export const countVisitsForDeveloper = async (developerId) => {
  if (!developerId || !Types.ObjectId.isValid(developerId)) {
    throw new AppError("Invalid developer ID", 400);
  }

  try{
    const devExists = await Developer.exists({ _id: developerId });
    if (!devExists) {
      throw new NotFoundError("Developer not found");
    }
    const count = await Visit.countDocuments({ developer_id: developerId });
    return count;

  } catch(err) {
    if (err instanceof AppError) {
      throw err;
    }
    console.error("[countVisitsForDeveloper] Unexpected error:", err);
    throw new AppError("Failed to count visits", 500, null, err);
  }
}