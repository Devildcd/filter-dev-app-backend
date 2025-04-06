import express from "express";
import authMiddleware from '../middlewares/auth.middleware.js';
import { getDevelopers } from "../controllers/developer.controller.js";

const router = express.Router();

router.get("/", getDevelopers);

export default router;
