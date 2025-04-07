import asyncHandler from "express-async-handler";
import { sendResponse } from "../utils/apiResponse.js";
import {
  deleteProject,
  getAllProjects,
  getProjectById,
  storeProject,
  updateProject,
} from "../services/project.service.js";

export const getProjects = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status = "active",
  } = req.query;

  const result = await getAllProjects(
    Number(page),
    Number(limit),
    sortBy,
    sortOrder,
    status
  );

  sendResponse(res, 200, "Projects retrieved successfully", result);
});

export const showProject = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.id);
  sendResponse(res, 200, "Project retrieved successfuly", project);
});

export const createProject = asyncHandler(async (req, res) => {
  const newProject = req.body;
  const projectData = await storeProject(newProject);

  sendResponse(res, 200, "Projects created successfully", projectData);
});

export const editProject = asyncHandler(async (req, res) => {
  const updatedProject = await updateProject(req.params.id, req.body);
  sendResponse(res, 200, "Project updated successfuly", updatedProject);
});

export const destroyProject = asyncHandler(async (req, res) => {
  const project = req.params.id;
  await deleteProject(project);

  sendResponse(res, 200, "Project deleted successfully");
});
