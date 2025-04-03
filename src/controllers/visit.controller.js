import asyncHandler from "express-async-handler";
import { countVisits, registerVisit } from "../services/visit.service";

export const getVisitCount = asyncHandler(async (req, res) => {
    const { developerId } = req.params;
    
    if (!developerId) {
        res.status(400);
        throw new Error('Developer ID is required');
    }

    const count = await countVisits(developerId);
    
    res.status(200).json({
        success: true,
        data: {
            visitCount: count
        },
        message: 'Visit count retrieved successfully'
    });
});

export const addVisit = asyncHandler(async (req, res) => {
    const { developerId } = req.body;
    
    if (!developerId) {
        res.status(400);
        throw new Error('Developer ID is required');
    }

    const userId = req.user?._id || null;  
    const ip = req.ip;

    const newVisit = await registerVisit(developerId, userId, ip);
    
    res.status(201).json({
        success: true,
        data: newVisit,
        message: 'Visit registered successfully'
    });
});