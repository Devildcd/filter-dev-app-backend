import express from "express";
import authMiddleware from '../middlewares/auth.middleware.js';
import { createDeveloper, destroyDeveloper, editDeveloper, getDevelopers, showDeveloper } from "../controllers/developer.controller.js";

const router = express.Router();

router.get("/", authMiddleware,  getDevelopers);
router.get("/:id", authMiddleware,  showDeveloper);
router.post("/", authMiddleware,  createDeveloper);
router.put("/:id", authMiddleware, editDeveloper);
router.delete("/:id", authMiddleware, destroyDeveloper);

export default router;
