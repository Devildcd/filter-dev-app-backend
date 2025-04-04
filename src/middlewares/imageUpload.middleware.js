import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Ruta donde se guardarán las imágenes
const uploadPath = path.join("uploads", "images");

// Crear la carpeta si no existe
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("📂 Carpeta creada:", uploadPath);
} else {
    console.log("✅ Carpeta existente:", uploadPath);
}

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Obtener extensión del archivo
        const filename = `${uuidv4()}${ext}`; // Generar un nombre único
        cb(null, filename);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg", // JPEG
        "image/png", // PNG
        "image/gif", // GIF
        "image/webp", // WEBP
        "image/jpg", //JPG
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

// Middleware de `multer` para imágenes
export const imageUpload = multer({ storage, fileFilter });