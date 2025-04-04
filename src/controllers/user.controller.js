import asyncHandler from "express-async-handler";
import { sendResponse } from "../utils/apiResponse.js";
import {
  getAuthenticatedUser,
  updateUser,
  updateProfileImage,
  getAllUsers,
  deleteUser
} from "../services/user.service.js";

export const getUsers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const usersData = await getAllUsers(page, limit);

  sendResponse(res, 200, "Users retrieved successfully", usersData);
};

export const getUserAuth = asyncHandler(async (req, res) => {
  const user = await getAuthenticatedUser(req.user.id);
  sendResponse(res, 200, "User retrieved successfully", user);
});

export const editUser = asyncHandler(async (req, res) => {
  const updatedUser = await updateUser(req.user.id, req.body);
  sendResponse(res, 200, "User updated succesfully", updatedUser);
});

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    sendResponse(res, 400, "Image file is required");
  }

  const userId = req.user.id;
  const imagePath = `/uploads/images/${req.file.filename}`;
  const updatedUser = await updateProfileImage(userId, imagePath);

  sendResponse(res, 200, "Profile image updated successfully", updatedUser);
});

export const destroyUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  await deleteUser(userId);

  sendResponse(res, 200, "User deleted successfully");
});
