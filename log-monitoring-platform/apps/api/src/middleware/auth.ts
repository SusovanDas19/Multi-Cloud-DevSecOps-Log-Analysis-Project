import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    machineCode: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      machineCode: string;
    };

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      machineCode: decoded.machineCode,
    };

    next();
  } catch (err) {
    console.error("auth error:", err);
    return res.status(401).json({ message: "invalid or expired token" });
  }
}
