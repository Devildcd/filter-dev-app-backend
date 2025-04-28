import Rating from "../models/ratingModel.js";
import User from "../models/userModel.js";
import Developer from "../models/developerModel.js";
import { AppError } from "../errors/appError.js";
import { NotFoundError } from "../errors/index.js";

/**
 * Helper para cargar un Rating por ID,
 * validando formato y existencia.
 */
async function loadRatingOrFail(ratingId) {
  try {
    const rating = await Rating.findById(ratingId);
    if (!rating) throw new NotFoundError("Rating not found");
    return rating;
  } catch (err) {
    if (err.name === "CastError") {
      throw new AppError(400, "Invalid rating ID");
    }
    if (err instanceof AppError) throw err;
    throw new AppError(500, "Error loading rating", err);
  }
}

/**
 * Calculates the average rating score for a specific developer.
 * @param {string|ObjectId} developerId - The ID of the developer to calculate the average rating for
 * @returns {Promise<number>} The average rating score (0 if no ratings exist)
 * @throws {NotFoundError} If no developer exists with the provided ID
 * @throws {AppError} With status 400 if the developer ID is invalid
 * @throws {AppError} With status 500 if there's a server error during calculation
 * @description
 *   - Verifies developer existence before calculation
 *   - Uses MongoDB aggregation to compute the average
 *   - Returns 0 if the developer has no ratings
 *   - Handles specific error cases with appropriate status codes
 */
export const getAverageRating = async (developerId) => {
  try {
    const dev = await Developer.findById(developerId).select("_id").lean();
    if (!dev) throw new NotFoundError("Developer not found");

    const [group] = await Rating.aggregate([
      { $match: { developer_id: dev._id } },
      { $group: { _id: "$developer_id", avgScore: { $avg: "$score" } } },
    ]);
    return group?.avgScore || 0;

  } catch (err) {
    if (err.name === "CastError") {
      throw new AppError(400, "Invalid developer ID");
    }
    if (err instanceof AppError) throw err;
    throw new AppError(500, "Error calculating average rating", err);
  }
};


/**
 * Updates a rating's score with validation and error handling.
 * @param {string|ObjectId} ratingId - The ID of the rating to update
 * @param {number} newScore - The new score value (must be 1-5)
 * @returns {Promise<Object>} The updated rating document
 * @throws {AppError} With status 400 if:
 *   - Score is not a number or outside 1-5 range
 *   - Rating ID is invalid (CastError)
 *   - Validation fails (ValidationError)
 * @throws {NotFoundError} If no rating exists with the provided ID
 * @throws {AppError} With status 500 for unexpected server errors
 * @description
 *   - Performs strict score validation (numeric, 1-5 range)
 *   - Uses atomic update with validation
 *   - Provides detailed error logging
 *   - Returns the complete updated rating document
 */
export const updateRatingScore = async (ratingId, newScore) => {
  if (typeof newScore !== "number" || newScore < 1 || newScore > 5) {
    throw new AppError(400, "Score must be a number between 1 and 5");
  }

  try {
    const updated = await Rating.findByIdAndUpdate(
      ratingId,
      { $set: { score: newScore } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new NotFoundError("Rating not found");
    }

    return updated;
  } catch (err) {
    if (err.name === "CastError") {
      throw new AppError(400, "Invalid rating ID");
    }
    if (err.name === "ValidationError") {
      console.error("[updateRatingScore] ValidationError:", err.message);
      throw new AppError(400, `Validation failed: ${err.message}`, err);
    }
    console.error("[updateRatingScore] Unexpected error:", err.message);
    console.error(err.stack);
    throw new AppError(
      500,
      `Error updating rating score: ${err.message}`,
      err
    );
  }
};


/**
* Updates a rating's comment with validation and sanitization.
* @param {string|ObjectId} ratingId - The ID of the rating to update
* @param {string|null} newComment - The new comment (null to clear, string to update)
* @returns {Promise<Object>} The updated rating document
* @throws {AppError} With status 400 if:
*   - Comment is not null or string type
*   - Rating ID is invalid (CastError)
*   - Validation fails (ValidationError)
* @throws {NotFoundError} If no rating exists with the provided ID
* @throws {AppError} With status 500 for unexpected server errors
* @description
*   - Validates comment type (string or null)
*   - Trims and limits comments to 500 characters
*   - Converts null or empty comments to empty string
*   - Uses atomic update with validation
*   - Provides detailed error logging
*/
export const updateComment = async (ratingId, newComment) => {
  if (newComment != null && typeof newComment !== "string") {
    throw new AppError(400, "Comment must be a string");
  }

  try {
    const updated = await Rating.findByIdAndUpdate(
      ratingId,
      { $set: { comment: (newComment?.trim().slice(0, 500)) || "" } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new NotFoundError("Rating not found");
    }

    return updated;
  } catch (err) {
    if (err.name === "CastError") {
      throw new AppError(400, "Invalid rating ID");
    }
    if (err.name === "ValidationError") {
      console.error("[updateComment] ValidationError:", err.message);
      throw new AppError(400, `Validation failed: ${err.message}`, err);
    }
    console.error("[updateComment] Unexpected error:", err.message);
    console.error(err.stack);
    throw new AppError(500, `Error updating comment: ${err.message}`, err);
  }
};

/**
* Creates a new rating with comprehensive validation and sanitization.
* @param {Object} ratingData - The rating data to store
* @param {string|ObjectId} ratingData.userId - Required valid user ID (24-character hex string or ObjectId)
* @param {string|ObjectId} ratingData.developerId - Required valid developer ID (24-character hex string or ObjectId)
* @param {number} ratingData.score - Rating score (1-5)
* @param {string|null|undefined} [ratingData.comment] - Optional rating comment (max 500 chars after trimming)
* @returns {Promise<Object>} The created rating document as plain object
* @throws {AppError} With status 400 if:
*   - Score is invalid (not number or outside 1-5 range)
*   - Comment is not null, undefined or string type
*   - UserId or developerId are not valid ObjectId strings
* @throws {NotFoundError} If referenced user or developer doesn't exist
* @throws {AppError} With status 500 for unexpected server errors
* @description
*   - Validates all input parameters strictly
*   - Verifies existence of both user and developer
*   - Sanitizes comments (trims whitespace and limits to 500 chars)
*   - Converts null/undefined comments to empty string
*   - Returns plain JavaScript object without mongoose metadata
*/
export const storeRating = async (ratingData) => {
  const {
    userId,
    developerId,
    score,
    comment
  } = ratingData;

  try {
    if (typeof score !== "number" || score < 1 || score > 5) {
      throw new AppError(400, "Score must be a number between 1 and 5");
    }

    if (comment != null && typeof comment !== "string") {
      throw new AppError(400, "Comment must be a string");
    }

    const [user, dev] = await Promise.all([
      User.exists({ _id: userId }),
      Developer.exists({ _id: developerId }),
    ]);
    if (!user) throw new NotFoundError("User not found");
    if (!dev) throw new NotFoundError("Developer not found");

    const newRatingData = {
      user_id: user._id,
      developer_id: dev._id,
      score,
      comment: comment?.trim().slice(0, 500) || "",
    }

    const newRating = await Rating.create(newRatingData);
    return newRating.toObject();
  } catch (err) {
    console.error("Error creating rating:", err);
    if (err instanceof AppError) throw err;
    throw new AppError(500, "Failed to create rating", err);
  }
}

/**
* Deletes a rating by its ID after validation.
* @param {string|ObjectId} ratingId - The ID of the rating to delete (must be a valid ObjectId)
* @returns {Promise<Object>} An object with a success message
* @throws {AppError} With status 400 if:
*   - The rating ID is invalid (CastError)
* @throws {NotFoundError} If the rating doesn't exist (thrown by loadRatingOrFail)
* @throws {AppError} With status 500 for unexpected server errors
* @description
*   - Validates the rating ID format
*   - Verifies rating existence through loadRatingOrFail
*   - Performs the deletion operation
*   - Returns a success message on successful deletion
*   - Handles specific database errors appropriately
*/
export const deleteRating = async (ratingId) => {
  const rating = await loadRatingOrFail(ratingId);
  try {
    await rating.deleteOne();
    return { message: "Rating deleted successfully" };
  } catch (err) {
    if (err.name === "CastError") {
      throw new AppError(400, "Invalid rating ID");
    }
    if (err instanceof AppError) {
      throw err;
    }
    console.error("Error deleting rating:", err);
    throw new AppError(500, "Error deleting rating", err);
  }
}
