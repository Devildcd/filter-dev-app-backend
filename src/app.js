import express from 'express';
import cors from 'cors';
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from 'cookie-parser';
import routes from "./routes/index.js";

import { config, connectDB } from './config/index.js';

const app = express();

connectDB();

// Middlewares
app.use(express.json());
// app.use(cors({ origin: config.corsOrigin }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/uploads/documents", express.static("uploads/documents"));

// Routes
app.use("/api", routes);

export default app;