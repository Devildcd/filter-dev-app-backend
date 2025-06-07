import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Middleware para autenticar conexiones de Socket.IO.
 * Extrae el token de handshake.auth.token, lo verifica y busca el usuario.
 * Luego lo adjunta a socket.user y le une a su sala personal.
 */
export default async function socketAuth(socket, next) {
  try {
    // 1️⃣ Obtener el token enviado desde el cliente:
    //    cliente: io.connect(url, { auth: { token } })
    const token =  socket.handshake.auth?.token ||                 // cliente Socket.IO
    socket.handshake.headers?.authorization?.split(' ')[1] || // header WS
    socket.handshake.query?.token;                  // query string
    
    if (!token) {
      const err = new Error("Unauthorized: token not provided");
      err.data = { code: 401 };
      throw err;
    }

    // 2️⃣ Verificar y decodificar el JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Buscar el usuario en BD
    const user = await User.findById(decoded.id).select("_id name email role");
    if (!user) {
      const err = new Error("Unauthorized: user not found");
      err.data = { code: 401 };
      throw err;
    }

    // 4️⃣ Adjuntar usuario al socket y unirlo a su room privada
    socket.user = user;
    socket.join(`user_${user._id}`);

    // 5️⃣ Pasar al siguiente handler
    return next();
  } catch (error) {
    console.error("Socket auth failed:", error);
    // Si pasas un error a next(), Socket.IO lo rechaza y cierra la conexión.
    return next(error);
  }
}