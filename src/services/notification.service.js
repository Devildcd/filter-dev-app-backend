import Notification from "../models/notificationModel.js";
import { Types } from "mongoose";
import { AppError } from "../errors/appError.js";
import Follow from "../models/followModel.js";

/**
* Creates and stores notifications for all followers of a developer.
* @param {Object} notificationData - Notification data
* @param {string|ObjectId} notificationData.developerId - Valid ID of the developer
* @param {string} notificationData.message - Notification message content
* @returns {Promise<Array<Object>>} Array of created notification documents
* @throws {AppError} With status 400 if:
*   - developerId is missing or invalid
*   - message is missing, not a string, or less than 5 characters
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates developer ID format and message requirements
*   - Retrieves all followers of the specified developer
*   - Creates individual notifications for each follower
*   - Returns empty array if developer has no followers
*   - Trims whitespace from notification message
* @note The message content will be automatically trimmed and must be at least 5 characters long
*/
export const storeNotifications = async ({developerId, message}) => {
  if (!developerId || !Types.ObjectId.isValid(developerId)) {
    throw new AppError("Invalid developer ID", 400);
  }

  if (!message || typeof message !== "string" || message.trim().length < 5) {
    throw new AppError("Message must be a valid string of at least 5 characters", 400);
  }

      try{
        const followers = await Follow.find({ developer_id: developerId }).select("user_id");

        if(!followers.length) return [];

        const notifications = followers.map(f => ({
          user_id: f.user_id,
          developer_id: developerId,
          message: message.trim(),
        }));

        const created = await Notification.insertMany(notifications);
        return created;

      } catch(err) {
        console.error("[createNotification] Unexpected error:", err.message);
        throw new AppError("Failed to create notification", 500, null, err);
      }
}

/**
* Retrieves notifications for a specific user with pagination and filtering options.
* @param {string|ObjectId} userId - Valid ID of the user
* @param {Object} [options] - Query options
* @param {boolean} [options.unreadOnly=false] - Whether to return only unread notifications
* @param {number} [options.limit=20] - Maximum number of notifications to return
* @param {number} [options.page=1] - Page number for pagination
* @returns {Promise<Array<Object>>} Array of notification documents
* @throws {AppError} With status 400 if userId is missing or invalid
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates user ID format
*   - Supports filtering by read status
*   - Implements pagination with configurable page size
*   - Returns notifications sorted by date (newest first)
*   - Uses skip/limit for pagination
* @note Default pagination returns 20 results per page, starting from page 1
*/
export const getUserNotifications = async (userId, { unreadOnly = false, limit = 20, page = 1 } = {}) => {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }
  
    try {
      const filter = { user_id: userId };
      if (unreadOnly) {
        filter.read = false;
      }
  
      const notifications = await Notification.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
  
      return notifications;
    } catch (err) {
      console.error("[getUserNotifications] Unexpected error:", err);
      throw new AppError("Failed to fetch notifications", 500, null, err);
    }
  };
  
  /**
* Updates a notification's read status to true.
* @param {string|ObjectId} notificationId - Valid ID of the notification to update
* @returns {Promise<Object>} The updated notification document
* @throws {AppError} With status 400 if notificationId is missing or invalid
* @throws {AppError} With status 404 if notification is not found
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates notification ID format
*   - Updates the notification's read status to true
*   - Returns the updated notification document
*   - Uses atomic update operation for consistency
* @note The operation returns the complete updated notification document by default
*/
  export const markNotificationAsRead = async (notificationId) => {
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      throw new AppError("Invalid notification ID", 400);
    }
  
    try {
      const updated = await Notification.findByIdAndUpdate(
        notificationId,
        { $set: { read: true } },
        { new: true }
      );
  
      if (!updated) {
        throw new AppError("Notification not found", 404);
      }
  
      return updated;
    } catch (err) {
      console.error("[markNotificationAsRead] Unexpected error:", err);
      throw new AppError("Failed to mark notification as read", 500, null, err);
    }
  };
  
  /**
* Marks all unread notifications as read for a specific user.
* @param {string|ObjectId} userId - Valid ID of the user
* @returns {Promise<Object>} Object containing count of updated notifications
* @throws {AppError} With status 400 if userId is missing or invalid
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates user ID format
*   - Performs bulk update of all unread notifications
*   - Returns the count of modified notifications
*   - Only affects notifications that were previously unread
* @note The operation returns an object with the updatedCount property indicating how many notifications were modified
*/
  export const markAllAsRead = async (userId) => {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }
  
    try {
      const result = await Notification.updateMany(
        { user_id: userId, read: false },
        { $set: { read: true } }
      );
      return { updatedCount: result.modifiedCount };
    } catch (err) {
      console.error("[markAllAsRead] Unexpected error:", err);
      throw new AppError("Failed to mark all notifications as read", 500, null, err);
    }
  };
  
  /**
* Permanently deletes a specific notification.
* @param {string|ObjectId} notificationId - Valid ID of the notification to delete
* @returns {Promise<Object>} Success message object
* @throws {AppError} With status 400 if notificationId is missing or invalid
* @throws {AppError} With status 404 if notification is not found
* @throws {AppError} With status 500 for unexpected database errors
* @description
*   - Validates notification ID format
*   - Performs direct deletion by ID
*   - Returns success message upon successful deletion
*   - Verifies notification existence before deletion
* @note The operation returns a confirmation message rather than the deleted document
*/
  export const deleteNotification = async (notificationId) => {
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      throw new AppError("Invalid notification ID", 400);
    }
  
    try {
      const result = await Notification.findByIdAndDelete(notificationId);
      if (!result) {
        throw new AppError("Notification not found", 404);
      }
      return { message: "Notification deleted successfully" };
    } catch (err) {
      console.error("[deleteNotification] Unexpected error:", err);
      throw new AppError("Failed to delete notification", 500, null, err);
    }
  };

