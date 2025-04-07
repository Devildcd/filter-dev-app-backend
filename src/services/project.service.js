import { NotFoundError } from "../errors/index.js";
import Developer from "../models/developerModel.js";
import Project from "../models/projectModel.js";
import validator from "validator";

/**
 * Retrieves a paginated and filtered list of projects with sorting options.
 * @param {number} [page=1] - The page number to retrieve (1-based index)
 * @param {number} [limit=10] - The maximum number of projects per page
 * @param {string} [sortBy="createdAt"] - The field to sort the results by
 * @param {string} [sortOrder="desc"] - The sort direction ("asc" or "desc")
 * @param {string} [status="active"] - Filter projects by status
 * @returns {Promise<Object>} An object containing:
 *   - projects {Array<Object>} - List of project documents
 *   - totalProjects {number} - Total count of matching projects
 *   - totalPages {number} - Total number of available pages
 *   - currentPage {number} - The current page number
 * @throws {Error} If there's a database error while fetching projects
 */
export const getAllProjects = async (
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  status = "active"
) => {
  try {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const projects = await Project.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProjects = await Project.countDocuments(filter);
    const totalPages = Math.ceil(totalProjects / limit);

    return {
      projects,
      totalProjects,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to retrieve projects");
  }
};

/**
 * Retrieves a project by its ID with selected fields.
 * @param {string|ObjectId} projectId - The ID of the project to retrieve
 * @returns {Promise<Object>} The project document containing:
 *   - name {string} - Project name
 *   - launch_date {Date} - Project launch date
 *   - status {string} - Current project status
 *   - performance {Object} - Performance metrics
 *   - explorer_link {string} - Blockchain explorer link
 * @throws {NotFoundError} If no project exists with the provided ID
 * @throws {Error} If there's a database error while fetching the project
 */
export const getProjectById = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
      .select("name launch_date status performance explorer_link")
      .lean();

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project;
  } catch (error) {
    console.error("Error retrieving project:", error);
    throw new Error("Failed to retrieve project");
  }
};

/**
 * Creates a new project with validation and business logic.
 * @param {Object} projectData - The project data to store
 * @param {string|ObjectId} projectData.developer_id - Required developer reference ID
 * @param {string} projectData.name - Project name (3-100 characters)
 * @param {string|Date} projectData.launch_date - Required valid launch date
 * @param {string} [projectData.status] - Optional project status (must be from predefined enum)
 * @param {Object} [projectData.performance] - Optional performance metrics
 * @param {number} [projectData.performance.daily_users] - Daily users count (non-negative)
 * @param {number} [projectData.performance.transactions] - Transactions count (non-negative)
 * @param {number} [projectData.performance.volume] - Transaction volume (non-negative)
 * @param {string|Date} [projectData.performance.last_updated] - Last update timestamp
 * @param {string} [projectData.explorer_link] - Optional valid blockchain explorer URL
 * @returns {Promise<Object>} The created project document
 * @throws {Error} When validation fails for:
 *   - Missing or invalid developer reference
 *   - Invalid project name (length, format or uniqueness)
 *   - Invalid launch date
 *   - Invalid status value
 *   - Negative performance metrics
 *   - Invalid explorer link URL
 *   - Database operation failure
 */
export const storeProject = async (projectData) => {
  const {
    developer_id,
    name,
    launch_date,
    status,
    performance,
    explorer_link,
  } = projectData;

  const developerExists = await Developer.exists({ _id: developer_id });
  try {
    if (!developerExists) {
      throw new Error("Referenced developer does not exist");
    }

    if (
      !name ||
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 100
    ) {
      throw new Error(
        "Project name must be a string between 3 and 100 characters long"
      );
    }

    const existingProjectName = await Project.findOne({ name });
    if (existingProjectName) {
      throw new Error("Project name already in use");
    }

    if (!launch_date || isNaN(new Date(launch_date).getTime())) {
      throw new Error("Launch date must be a valid date");
    }

    if (status && !statusEnum.includes(status)) {
      throw new Error(`Status must be one of: ${statusEnum.join(", ")}`);
    }

    if (performance) {
      const { daily_users, transactions, volume } = performance;
      if (
        (daily_users && (typeof daily_users !== "number" || daily_users < 0)) ||
        (transactions &&
          (typeof transactions !== "number" || transactions < 0)) ||
        (volume && (typeof volume !== "number" || volume < 0))
      ) {
        throw new Error("Performance metrics must be non-negative numbers");
      }
    }

    if (
      explorer_link &&
      !validator.isURL(explorer_link, { require_protocol: true })
    ) {
      throw new Error("Explorer link must be a valid URL");
    }

    const newProjectData = {
      ...projectData,
      performance: performance
        ? {
            daily_users: performance.daily_users ?? 0,
            transactions: performance.transactions ?? 0,
            volume: performance.volume ?? 0,
            last_updated: performance.last_updated
              ? new Date(performance.last_updated)
              : new Date(),
          }
        : undefined,
    };

    const newProject = await Project.create(newProjectData);
    const projectObject = newProject.toObject();
    return projectObject;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }
};

/**
 * Updates a project's information with field validation and sanitization.
 * @param {string|ObjectId} projectId - The ID of the project to update
 * @param {Object} updatedData - Data containing fields to update
 * @param {string} [updatedData.name] - Updated project name
 * @param {string|Date} [updatedData.launch_date] - Updated launch date
 * @param {string} [updatedData.status] - Updated project status
 * @param {Object} [updatedData.performance] - Updated performance metrics
 * @returns {Promise<Object>} The updated project document (without developer_id)
 * @throws {Error} When:
 *   - No valid updatable fields are provided
 *   - Database validation fails for any field
 * @throws {NotFoundError} If project with given ID doesn't exist
 * @description 
 *   - Only allows updates to specific fields (name, launch_date, status, performance)
 *   - Excludes developer_id from being returned
 *   - Runs MongoDB validators on update
 */
export const updateProject = async (projectId, updatedData) => {
  try {
    const allowedFields = ["name", "launch_date", "status", "performance"];
    const filteredData = Object.fromEntries(
      Object.entries(updatedData).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-developer_id")
      .lean();

    if (!updatedProject) {
      throw new NotFoundError("Project not found");
    }

    return updatedProject;
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }
};

/**
 * Deletes a project by its ID.
 * @param {string|ObjectId} projectId - The ID of the project to delete
 * @returns {Promise<Object>} Success message object with structure:
 *   - message {string} - Confirmation message
 * @throws {NotFoundError} If no project exists with the provided ID
 * @throws {Error} If there's a database error during deletion
 * @description
 *   - Verifies project existence before deletion
 *   - Returns confirmation message on success
 */
export const deleteProject = async (projectId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return { message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }
};
