import express from "express";
import { register, login, refreshToken, logout } from "../controllers/auth.controller.js";
import loginLimiter from "../middlewares/loginLimiter.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", loginLimiter,  login);
router.post("/refresh", authMiddleware, refreshToken);
router.post("/logout", authMiddleware, logout);

export default router;