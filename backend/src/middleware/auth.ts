import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/env";
import { AppError } from "./errorHandler";

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

function isAuthPayload(payload: unknown): payload is AuthPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    "email" in payload &&
    "role" in payload &&
    typeof (payload as AuthPayload).userId === "number" &&
    typeof (payload as AuthPayload).email === "string" &&
    typeof (payload as AuthPayload).role === "string"
  );
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    let token: string | undefined;

    // 1. Попробовать получить из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    // 2. Если нет в заголовке, попробовать получить из куки
    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      console.warn(`[Auth] Missing token for ${req.method} ${req.originalUrl}. Cookies: ${JSON.stringify(Object.keys(req.cookies || {}))}, AuthHeader: ${authHeader ? 'present' : 'missing'}`);
      throw new AppError("Authentication required (token missing)", 401);
    }

    try {
      const payload = jwt.verify(token, jwtSecret);

      if (!isAuthPayload(payload)) {
        console.error(`[Auth] Invalid token payload: ${JSON.stringify(payload)}`);
        throw new AppError("Invalid token payload", 401);
      }

      req.user = payload;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AppError("Token has expired", 401);
      }
      throw new AppError("Invalid token", 401);
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Access denied", 403));
    }

    next();
  };
};

export const isAdmin = authorize(["admin", "staff"]);
