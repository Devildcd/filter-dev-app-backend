import asyncHandler from "express-async-handler";
import { deleteNotification, getUserNotifications, markAllAsRead, markNotificationAsRead, storeNotifications } from "../services/notification.service.js";
import { sendResponse } from "../utils/apiResponse.js";

// Post /notifications
export const notifyFollowers = asyncHandler(async (req, res) => {
  const { developerId, message } = req.body;

  const notifications = await storeNotifications({ developerId, message });

  sendResponse(res, 201, `${notifications.length} notifications sent to followers`, notifications);
});

// Get /notifications/:id/user
export const showUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { unreadOnly = false, limit = 20, page = 1 } = req.query;

  const notifications = await getUserNotifications(userId, {
    unreadOnly: unreadOnly === "true",
    limit: parseInt(limit),
    page: parseInt(page),
  });

  sendResponse(res, 200, "Notifications retrieved successfuly", notifications);
});

// Patch /notifications/:id/read
export const tickNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updated = await markNotificationAsRead(id);

  sendResponse(res, 200, "Notification ticked successfuly", updated);
});

// Patch /notifications/:id/user/all-read
export const tickkAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await markAllAsRead(userId);

  sendResponse(res, 200, "Notifications ticked successfuly", result);
});

// Delete /notifications/:id
export const destroyNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await deleteNotification(id);

  sendResponse(res, 200, "Notifications deleted successfuly", result);
});