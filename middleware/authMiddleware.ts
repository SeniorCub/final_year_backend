import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
     user?: {
          userId: string;
          email: string;
     };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
     let token;

     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          try {
               token = req.headers.authorization.split(' ')[1];
               const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
               req.user = decoded;
               next();
          } catch (error) {
               res.status(401).json({ success: false, message: 'Not authorized, token failed' });
          }
     } else {
          res.status(401).json({ success: false, message: 'Not authorized, no token' });
     }
};
