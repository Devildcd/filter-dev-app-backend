import express from "express";
import authMiddleware from '../middlewares/auth.middleware.js';
import { createDeveloper, destroyDeveloper, editDeveloper, getDevelopers, showDeveloper } from "../controllers/developer.controller.js";

const router = express.Router();

router.get("/",  getDevelopers);
router.get("/:id",  showDeveloper);
router.post("/",  createDeveloper);
router.put("/:id", editDeveloper);
router.delete("/:id", destroyDeveloper);

export default router;
