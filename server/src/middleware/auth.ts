import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import type { SessionService } from '../services/sessionService.js';

export function createAuthMiddleware(sessionService: SessionService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sessionId = req.cookies[config.sessionCookieName];

    if (!sessionId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = sessionService.getSessionUser(sessionId);
    if (!user) {
      // Clear invalid cookie
      res.clearCookie(config.sessionCookieName, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProduction,
      });
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = user;
    req.sessionId = sessionId;
    next();
  };
}
