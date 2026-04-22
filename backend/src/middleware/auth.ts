import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthRequest extends Request {
  staffId?: number;
  staffUsername?: string;
  staffDisplayName?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { id: number; username: string; displayName: string };
    req.staffId = decoded.id;
    req.staffUsername = decoded.username;
    req.staffDisplayName = decoded.displayName;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// No-op for endpoints that don't require auth but want staff context (optional)
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      const decoded = jwt.verify(token, config.jwtSecret) as { id: number; username: string; displayName: string };
      req.staffId = decoded.id;
      req.staffUsername = decoded.username;
      req.staffDisplayName = decoded.displayName;
    } catch { /* ignored */ }
  }
  next();
}
