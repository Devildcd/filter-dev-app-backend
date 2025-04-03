import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Obtener el token

    if (!token) {
      return res.status(401).json({ message: "Unauthorized, no token provided" });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario por el id del token decodificado
    const user = await User.findById(decoded.id).select("_id name email role");
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // Asignar el usuario a `req.user`

    next(); // Continuar con el siguiente middleware o ruta
  } catch (error) {
    console.error(error); // Para depuración
    res.status(401).json({ message: "Unauthorized, invalid token" });
  }
};

export default authMiddleware;