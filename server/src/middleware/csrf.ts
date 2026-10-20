import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Only protect state-modifying requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Cross-site requests initiated by browsers always attach Sec-Fetch-Site or Origin/Referer
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'cross-site') {
    res.status(403).json({ error: 'Forbidden: Cross-site request rejected' });
    return;
  }

  const originHeader = req.headers['origin'];
  const refererHeader = req.headers['referer'];

  const checkSource = (urlStr: string): boolean => {
    try {
      const url = new URL(urlStr);
      const expectedOrigin = new URL(config.corsOrigin);
      return url.origin === expectedOrigin.origin || url.host === req.headers['host'];
    } catch {
      return false;
    }
  };

  if (originHeader) {
    if (typeof originHeader === 'string' && checkSource(originHeader)) {
      return next();
    }
    res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    return;
  }

  if (refererHeader) {
    if (typeof refererHeader === 'string' && checkSource(refererHeader)) {
      return next();
    }
    res.status(403).json({ error: 'Forbidden: Invalid request referer' });
    return;
  }

  // Same-origin or non-browser/test clients without origin headers
  next();
}
