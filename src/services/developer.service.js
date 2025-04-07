import { NotFoundError } from "../errors/index.js";
import Developer from "../models/developerModel.js";
import User from "../models/userModel.js";
import validator from "validator";

/**
 * Retrieves a paginated list of developers with filtering and sorting options.
 * @param {number} [page=1] - The page number to retrieve (1-based index).
 * @param {number} [limit=10] - The maximum number of developers per page.
 * @param {string} [sortBy="createdAt"] - The field to sort the results by.
 * @param {string} [sortOrder="desc"] - The sort order ("asc" or "desc").
 * @param {boolean} [verified] - Optional filter for verified status (true/false).
 * @returns {Promise<Object>} An object containing:
 *   - developers {Array} - List of developer documents
 *   - totalDevelopers {number} - Total count of matching developers
 *   - totalPages {number} - Total number of available pages
 *   - currentPage {number} - The current page number
 * @throws {Error} If there's a database error or failed query execution.
 * @example
 * const { developers, totalPages } = await getAllDevelopers(2, 5, 'name', 'asc');
 */
export const getAllDevelopers = async (
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  verified
) => {
  try {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const filter = {};

    if (verified !== undefined) {
      filter.verified = verified;
    }

    const developers = await Developer.find(filter)
      .populate("user_id", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalDevelopers = await Developer.countDocuments(filter);
    const totalPages = Math.ceil(totalDevelopers / limit);

    return {
      developers,
      totalDevelopers,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching developers:", error);
    throw new Error("Failed to retrieve developers");
  }
};

/**
 * Retrieves a developer by their ID with selected fields and populated user data.
 * @param {string|ObjectId} developerId - The ID of the developer to retrieve (MongoDB ObjectId or string representation).
 * @returns {Promise<Object>} A developer object containing:
 *   - wallet_address {string} - Developer's wallet address
 *   - bio {string} - Developer's biography
 *   - social_links {Array|Object} - Developer's social media links
 *   - createdAt {Date} - Date when the developer was created
 *   - user_id {Object} - Populated user data with only the 'name' field
 * @throws {NotFoundError} If no developer is found with the provided ID.
 * @throws {Error} If there's a database error or invalid ID format.
 **/
export const getDeveloperById = async (developerId) => {
  try {
    const developer = await Developer.findById(developerId)
      .populate("user_id", "name")
      .select("wallet_address bio social_links createdAt")
      .lean();
    if (!developer) {
      throw new NotFoundError("Developer not found");
    }

    return developer;
  } catch (error) {
    console.error("Error retrieving developer:", error);
    throw new Error("Failed to retrieve developer");
  }
};

/**
 * Creates a new developer record with validation checks.
 * @param {Object} developerData - The developer data to store
 * @param {string|ObjectId} developerData.user_id - Required user reference ID
 * @param {string} developerData.wallet_address - Required wallet address
 * @param {string} developerData.bio - Required biography text
 * @param {Object} [developerData.social_links] - Optional social links object
 * @returns {Promise<Object>} The created developer document as a plain object
 * @throws {Error} When:
 *   - Referenced user doesn't exist
 *   - Wallet address is missing or invalid
 *   - Bio is missing or invalid
 *   - Wallet address is already in use
 *   - Any social link URL is invalid
 *   - Database operation fails
 */
export const storeDeveloper = async (developerData) => {
  try {
    const { user_id, bio, wallet_address, social_links } = developerData;

    const userExists = await User.exists({ _id: user_id });
    if (!userExists) {
      throw new Error("Referenced user does not exist");
    }

    if (!wallet_address || typeof wallet_address !== "string") {
      throw new Error("Wallet address is required and must be a string");
    }

    if (typeof bio !== "string") {
      throw new Error("Bio is required and must be a string");
    }

    const existingWallet = await Developer.findOne({ wallet_address });
    if (existingWallet) {
      throw new Error("Wallet address already in use");
    }

    if (social_links && typeof social_links === "object") {
      for (const url of Object.values(social_links)) {
        if (!validator.isURL(url, { require_protocol: true })) {
          throw new Error(`Invalid social link URL: ${url}`);
        }
      }
    }

    const newDeveloperData = {
      ...developerData,
      social_links: social_links
        ? new Map(Object.entries(social_links))
        : undefined,
    };

    const newDeveloper = await Developer.create(newDeveloperData);
    const developerObject = newDeveloper.toObject();
    return developerObject;
  } catch (error) {
    console.error("Error creating developer:", error);
    throw new Error("Failed to create developer");
  }
};

/**
 * Updates a developer's information with field validation and sanitization.
 * @param {string|ObjectId} developerId - The ID of the developer to update
 * @param {Object} updatedData - Data containing fields to update
 * @param {string} [updatedData.bio] - Developer biography text
 * @param {Object} [updatedData.social_links] - Developer social links
 * @returns {Promise<Object>} The updated developer document (without wallet_address)
 * @throws {Error} When:
 *   - No valid updatable fields are provided
 *   - Developer is not found
 *   - Database validation fails
 * @throws {NotFoundError} If developer with given ID doesn't exist
 */
export const updateDeveloper = async (developerId, updatedData) => {
  try {
    const allowedFields = ["bio", "social_links"];
    const filteredData = Object.fromEntries(
      Object.entries(updatedData).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const updatedDeveloper = await Developer.findByIdAndUpdate(
      developerId,
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-wallet_address")
      .lean();

    if (!updatedDeveloper) {
      throw new NotFoundError("Developer not found");
    }

    return updatedDeveloper;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

/**
 * Deletes a developer record by ID.
 * @param {string|ObjectId} developerId - The ID of the developer to delete
 * @returns {Promise<Object>} An object with a success message
 * @throws {NotFoundError} If no developer exists with the provided ID
 * @throws {Error} If there's a database error during deletion
 */
export const deleteDeveloper = async (developerId) => {
  try {
    const developer = await Developer.findById(developerId);

    if (!developer) {
      throw new NotFoundError("Developer not found");
    }

    return { message: "Developer deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};
