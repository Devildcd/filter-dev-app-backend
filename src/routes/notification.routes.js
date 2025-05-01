import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { destroyNotification, notifyFollowers, showUserNotifications, tickkAllAsRead, tickNotificationAsRead } from "../controllers/notification.controller.js";


const router = express.Router();

router.get("/:id/user", authMiddleware, showUserNotifications);
router.post("/", authMiddleware, notifyFollowers);
router.patch("/:id/read", authMiddleware, tickNotificationAsRead);
router.patch("/:id/user/all-read", authMiddleware, tickkAllAsRead);
router.delete("/:id", authMiddleware, destroyNotification);

export default router;