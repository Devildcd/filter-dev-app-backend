export class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.name = this.constructor.name; // Nombre de la clase de error
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Indica que es un error manejable en producción

    Error.captureStackTrace(this, this.constructor);
  }
}
