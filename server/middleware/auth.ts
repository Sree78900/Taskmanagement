import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { UserRole, type UserRoleType, type UserPublic } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "your-super-secret-jwt-key-change-in-production";

export interface AuthRequest extends Request {
  user?: UserPublic;
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: "refresh" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const publicUser: UserPublic = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    };
    req.user = publicUser;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
}

export function requireRole(...roles: UserRoleType[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  next();
}
