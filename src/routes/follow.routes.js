import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { createFollowDeveloper, getCountFollowersForDeveloper, removeFollow, showFollowersForDeveloper } from "../controllers/follow.controller.js";


const router = express.Router();

router.get("/:id/developer", showFollowersForDeveloper);
router.get("/:id/developer/count", getCountFollowersForDeveloper);
router.post("/", authMiddleware, createFollowDeveloper);
router.delete("/:id", authMiddleware, removeFollow);

export default router;