import mongoose from "mongoose";
import { config } from './env.js';

// const connectDB = async() => {
//     try {
//         await mongoose.connect(config.mongoURI);
//         console.log('MongoDB connected');
//     } catch(error) {
//         console.error('MongoDB connection error:', error);
//         process.exit(1);
//     }
// };

// URL en la nube
const connectDB = async() => {
    try {
        await mongoose.connect(config.serverUrl);
        console.log('MongoDB connected');
    } catch(error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;