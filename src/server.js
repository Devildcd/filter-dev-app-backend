import {config} from './config/env.js';
import app from './app.js';
import connectDB from './config/db.js';
// Web Socket
// import http from 'http';
// import { Server as IOServer } from 'socket.io';
// import { initSockets } from './sockets/index.js';

const PORT = config.port;

const startServer = async () => {
  try {
    await connectDB(); 

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// Configuracion del servidor para usar Web Sockets
// const startServer = async () => {
//   try {
//     await connectDB();

    // 2️⃣ Crear servidor HTTP sobre Express
    // const httpServer = http.createServer(app);

    // 3️⃣ Inicializar Socket.IO sobre ese servidor
    // const io = new IOServer(httpServer, {
    //   cors: { origin: '*' },
    //   pingTimeout: 60000,
    // });

    // 4️⃣ Llamar a tu initSockets para namespaces y middleware
//     initSockets(io);

//     // 5️⃣ Escuchar peticiones HTTP y WS
//     httpServer.listen(PORT, () => {
//       console.log(`🚀 Server running at http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error('❌ Error starting server:', error);
//     process.exit(1);
//   }
// };

startServer();

