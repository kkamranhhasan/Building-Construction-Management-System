import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: { id: string; role: string; username?: string };
}

export const authMiddleware = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
        id: string;
        role: string;
        username?: string;
      };

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient role' });
        return;
      }

      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
  };
};
