import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Resolve directory of current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET || 'dev-local-session-secret-change-in-prod',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'mock_session_id',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databasePath: process.env.DATABASE_PATH 
    ? path.resolve(__dirname, '..', process.env.DATABASE_PATH)
    : path.resolve(__dirname, '../../data/mock.db'),
  sessionDurationDays: 7,
};
