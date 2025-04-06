import express from "express";
import { editUser, getUserAuth, uploadProfileImage, getUsers, destroyUser } from "../controllers/user.controller.js";
import authMiddleware from '../middlewares/auth.middleware.js';
import { imageUpload } from "../middlewares/imageUpload.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUserAuth);
router.put("/:id", authMiddleware, editUser);
router.post("/:id/profile-image", authMiddleware, imageUpload.single("image"), uploadProfileImage);
router.delete("/:id", authMiddleware, destroyUser);

export default router;