import asyncHandler from "express-async-handler";
import { sendResponse } from "../utils/apiResponse.js";
import { countVisitsForDeveloper, storeVisit } from "../services/visit.service.js";

// Get /visits/:id/developer
export const getVisistForDeveloper = asyncHandler( async (req, res) => {
    const {id: developerId} = req.params;
    const visits = await countVisitsForDeveloper(developerId);
    sendResponse(res, 200, "Visits retrieved successfuly", { visits });
});

// Post /visits
export const createVisit = asyncHandler( async (req, res) => {
   const created = await storeVisit(req.body);
   sendResponse(res, 201, "Visit created successfully", created);
});