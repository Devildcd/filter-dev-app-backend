import asyncHandler from "express-async-handler";
import { sendResponse } from "../utils/apiResponse.js";
import { countFollowersForDeveloper, followDeveloper, getFollowersForDeveloper, unfollowDeveloper } from "../services/follow.service.js";

// Get /follows/:id/developer
export const showFollowersForDeveloper = asyncHandler( async (req, res) => {
    const {id: developerId} = req.params;
    const followers = await getFollowersForDeveloper(developerId);
    sendResponse(res, 200, "Followers retrieved successfuly", followers );
});

// Get /follows/:id/developer/count
export const getCountFollowersForDeveloper = asyncHandler( async (req, res) => {
    const {id: developerId} = req.params;
    const count = await countFollowersForDeveloper(developerId);
    sendResponse(res, 200, "Followers count successfuly", { count });
});

// Post /follows
export const createFollowDeveloper = asyncHandler( async (req, res) => {
  const userId = req.user.id;
  const { developerId } = req.body;
  const follow = await followDeveloper({ userId, developerId });
   sendResponse(res, 201, "Follow created successfully", follow);
});

// Delete /follows/:id
export const removeFollow = asyncHandler( async (req, res) => {
    const userId = req.user.id;
    const { id: developerId } = req.params;
    const result = await unfollowDeveloper({ userId, developerId });
    sendResponse(res, 200, "Unfollowed successfully", result);
 });

