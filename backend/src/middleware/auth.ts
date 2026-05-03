import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/env";
import { AppError } from "./errorHandler";

export interface AuthPayload {
  userId: number;
  email: string;
}

function isAuthPayload(payload: unknown): payload is AuthPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    "email" in payload &&
    typeof (payload as AuthPayload).userId === "number" &&
    typeof (payload as AuthPayload).email === "string"
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
      throw new AppError("Authentication required", 401);
    }

    const payload = jwt.verify(token, jwtSecret);

    if (!isAuthPayload(payload)) {
      throw new AppError("Invalid token payload", 401);
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Invalid token", 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token has expired", 401));
    } else {
      next(error);
    }
  }
};
