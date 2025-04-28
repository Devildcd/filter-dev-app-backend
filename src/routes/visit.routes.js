import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { createVisit, getVisistForDeveloper } from "../controllers/visit.controller.js";

const router = express.Router();

router.get("/:id/developer", getVisistForDeveloper);
router.post("/", createVisit);

export default router;