import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/meme-coins-devs',
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || '*',
    jwtSecretKey: process.env.JWT_SECRET,
    jwtRefreshKey: process.env.JWT_REFRESH_SECRET,
    serverUrl: process.env.SERVER_URL
};