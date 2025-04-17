import {config} from './config/env.js';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = config.port;

const startServer = async () => {
  try {
    await connectDB(); // 1. Conectar a MongoDB

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();