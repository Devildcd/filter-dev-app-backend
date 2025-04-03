import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto (ventana de tiempo)
  max: 5,              // Límite de 5 peticiones por IP
  message: { error: "Too many login attempts. Please try again later" },
  standardHeaders: true, // Headers `RateLimit-*` compatibles
  legacyHeaders: false,  // Desactiva `X-RateLimit-*`
});

export default loginLimiter;