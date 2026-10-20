import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type Database from 'better-sqlite3';
import { config } from './config.js';
import { AuthService } from './services/authService.js';
import { SessionService } from './services/sessionService.js';
import { createAuthRouter } from './routes/auth.js';
import { createHealthRouter } from './routes/health.js';
import { csrfProtection } from './middleware/csrf.js';

export function createApp(db: Database.Database): express.Express {
  const app = express();

  const authService = new AuthService(db);
  const sessionService = new SessionService(db);

  // Trust proxy for secure cookies behind reverse proxies if applicable
  app.set('trust proxy', 1);

  // CORS configuration
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Body parsing and cookie parsing
  app.use(express.json());
  app.use(cookieParser());

  // CSRF protection for mutating requests
  app.use(csrfProtection);

  // Mount API routes
  app.use('/api/auth', createAuthRouter(authService, sessionService));
  app.use('/api/health', createHealthRouter());

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Centralized safe error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    // Log safe error message without sensitive payload
    console.error(`[Server Error] ${err.name}: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
