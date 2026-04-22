import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3100', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production-use-random-string',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '4h',
  dbPath: process.env.DB_PATH || './data/helpdesk.db',
  baileysAuthPath: process.env.BAILEYS_AUTH_PATH || './data/baileys-auth',
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  frontendBuildDir: process.env.FRONTEND_BUILD_DIR || '../frontend/dist',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
};
