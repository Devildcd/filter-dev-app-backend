import express from 'express';
import cors from 'cors';
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from 'cookie-parser';

import { config, connectDB } from './config/index.js';

import indexRoutes from './routes/index.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import developerRoutes from './routes/developers.routes.js';
import projectRoutes from './routes/project.routes.js';
import ratingRoutes from './routes/rating.routes.js';

const app = express();

connectDB();

// Middlewares
app.use(express.json());
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/uploads/documents", express.static("uploads/documents"));

// Routes
app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ratings', ratingRoutes);

export default app;