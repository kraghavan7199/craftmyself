import { Request, Response, NextFunction } from "express";
import { auth } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
     res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    
    const idToken = authHeader!.slice(7);
    
    if (!idToken) {
       res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    req.userId = decodedToken.uid;
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
   
     res.status(401).json({ error: 'Unauthorized - token invalid or expired' });
  }
};