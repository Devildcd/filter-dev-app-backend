import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { changeComment, changeScore, createRating, removeRating, showAverageRating } from "../controllers/rating.controller.js";

const router = express.Router();

router.get("/:id/developer/average", showAverageRating);
router.post("/", createRating);
router.patch("/:id/score", changeScore);
router.patch("/:id/comment", changeComment);
router.delete("/:id", removeRating);

export default router;