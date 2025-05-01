import express from "express";

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import developerRoutes from './developers.routes.js';
import projectRoutes from './project.routes.js';
import ratingRoutes from './rating.routes.js';
import visitRoutes from './visit.routes.js';
import followRoutes from './follow.routes.js';
import notificationRoutes from './notification.routes.js';

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/developers', developerRoutes);
router.use('/projects', projectRoutes);
router.use('/ratings', ratingRoutes);
router.use('/visits', visitRoutes);
router.use('/follows', followRoutes);
router.use('/notifications', notificationRoutes);

export default router;