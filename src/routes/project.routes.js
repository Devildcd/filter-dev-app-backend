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

router.get("/", getProjects);
router.get("/:id", showProject);
router.post("/", createProject);
router.put("/:id", editProject);
router.delete("/:id", destroyProject);

export default router;
