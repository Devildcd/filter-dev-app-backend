import asyncHandler from "express-async-handler";
import { sendResponse } from "../utils/apiResponse.js";
import { deleteRating, getAverageRating, storeRating, updateComment, updateRatingScore } from "../services/rating.service.js";

// GET /ratings/:id/developer/average
export const showAverageRating = asyncHandler( async (req, res) => {
    const { id: developerId } = req.params;
    const average = await getAverageRating(developerId);
    sendResponse(res, 200, "Rating retrieved successfuly", { average });
});

// POST /ratings
export const createRating = asyncHandler(async (req, res) => {
    const created = await storeRating(req.body);
    sendResponse(res, 201, "Rating created successfully", created);
  });

  // PATCH /ratings/:id/score
export const changeScore = asyncHandler(async (req, res) => {
    const updated = await updateRatingScore(req.params.id, req.body.score);
    sendResponse(res, 200, "Score updated successfully", updated);
  });
  
  // PATCH /ratings/:id/comment
  export const changeComment = asyncHandler(async (req, res) => {
    const updated = await updateComment(req.params.id, req.body.comment);
    sendResponse(res, 200, "Comment updated successfully", updated);
  });
  
  // DELETE /ratings/:id
  export const removeRating = asyncHandler(async (req, res) => {
    await deleteRating(req.params.id);
    sendResponse(res, 200, "Rating deleted successfully");
  });