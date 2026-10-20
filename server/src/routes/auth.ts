import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import type { AuthService } from '../services/authService.js';
import type { SessionService } from '../services/sessionService.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function createAuthRouter(authService: AuthService, sessionService: SessionService): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(sessionService);

  // Rate limiter for authentication attempts (15 attempts per minute)
  const authLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 15,
    message: 'Too many authentication attempts. Please wait a minute and try again.',
  });

  const setSessionCookie = (res: Response, sessionId: string, expiresAt: Date) => {
    res.cookie(config.sessionCookieName, sessionId, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
  };

  const clearSessionCookie = (res: Response) => {
    res.clearCookie(config.sessionCookieName, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      path: '/',
    });
  };

  /**
   * POST /api/auth/signup
   */
  router.post('/signup', authLimiter, (req: Request, res: Response): void => {
    const parseResult = signupSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      res.status(400).json({ error: firstIssue.message });
      return;
    }

    const { name, email, password } = parseResult.data;
    const result = authService.registerUser(name, email, password);

    if (result.error || !result.user) {
      res.status(409).json({ error: result.error || 'Registration failed' });
      return;
    }

    // Prevent session fixation by regenerating
    const existingSessionId = req.cookies[config.sessionCookieName];
    const { sessionId, expiresAt } = sessionService.regenerateSession(existingSessionId, result.user.id);

    setSessionCookie(res, sessionId, expiresAt);
    res.status(201).json({ user: result.user });
  });

  /**
   * POST /api/auth/login
   */
  router.post('/login', authLimiter, (req: Request, res: Response): void => {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      res.status(400).json({ error: firstIssue.message });
      return;
    }

    const { email, password } = parseResult.data;
    const result = authService.authenticate(email, password);

    if (result.error || !result.user) {
      res.status(401).json({ error: result.error || 'Invalid email or password' });
      return;
    }

    // Regenerate session identifier upon successful login
    const existingSessionId = req.cookies[config.sessionCookieName];
    const { sessionId, expiresAt } = sessionService.regenerateSession(existingSessionId, result.user.id);

    setSessionCookie(res, sessionId, expiresAt);
    res.status(200).json({ user: result.user });
  });

  /**
   * POST /api/auth/logout
   */
  router.post('/logout', (req: Request, res: Response): void => {
    const sessionId = req.cookies[config.sessionCookieName];
    if (sessionId) {
      sessionService.invalidateSession(sessionId);
    }
    clearSessionCookie(res);
    res.status(200).json({ message: 'Logged out successfully' });
  });

  /**
   * GET /api/auth/me
   */
  router.get('/me', requireAuth, (req: Request, res: Response): void => {
    res.status(200).json({ user: req.user });
  });

  return router;
}
