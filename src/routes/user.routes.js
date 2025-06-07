import express from "express";
import { editUser, getUserAuth, uploadProfileImage, getUsers, destroyUser } from "../controllers/user.controller.js";
import authMiddleware from '../middlewares/auth.middleware.js';
import { imageUpload } from "../middlewares/imageUpload.middleware.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUserAuth);
router.put("/:id", editUser);
router.post("/:id/profile-image", imageUpload.single("image"), uploadProfileImage);
router.delete("/:id", destroyUser);

export default router;