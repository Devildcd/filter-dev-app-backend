import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getProjects,
  showProject,
  createProject,
  editProject,
  destroyProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getProjects);
router.get("/:id", authMiddleware, showProject);
router.post("/", authMiddleware, createProject);
router.put("/:id", authMiddleware, editProject);
router.delete("/:id", authMiddleware, destroyProject);

export default router;
