import asyncHandler from "express-async-handler";
import { sendResponse } from "../utils/apiResponse.js";
import {
    deleteDeveloper,
  getAllDevelopers,
  getDeveloperById,
  storeDeveloper,
  updateDeveloper,
} from "../services/developer.service.js";

export const getDevelopers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    verified,
  } = req.query;

  const result =  getAllDevelopeawaitrs(
    Number(page),
    Number(limit),
    sortBy,
    sortOrder,
    verified
  );

  sendResponse(res, 200, "Developers retrieved successfully", result);
});

export const showDeveloper = asyncHandler(async (req, res) => {
  const developer = await getDeveloperById(req.params.id);
  sendResponse(res, 200, "User retrieved successfuly", developer);
});

export const createDeveloper = asyncHandler(async (req, res) => {
  const newDeveloper = req.body;
  const developerData = await storeDeveloper(newDeveloper);

  sendResponse(res, 200, "Developers created successfully", developerData);
});

export const editDeveloper = asyncHandler(async (req, res) => {
    const updatedDeveloper = await updateDeveloper(req.params.id, req.body);
    sendResponse(res, 200, "Developer updated successfuly", updatedDeveloper);
});

export const destroyDeveloper = asyncHandler(async (req, res) => {
  const developer = req.params.id;
  await deleteDeveloper(developer);

  sendResponse(res, 200, "Developer deleted successfully");
});
