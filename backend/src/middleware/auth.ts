// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { jwtSecret } from "../config/env";

export interface AuthPayload {
  customerId: number;
  email: string;
}

// ✅ Type Guard для проверки структуры payload
function isAuthPayload(payload: any): payload is AuthPayload {
  return (
    payload &&
    typeof payload.customerId === "number" &&
    typeof payload.email === "string"
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
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Требуется авторизация", 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token as string, jwtSecret);

    // ✅ Runtime проверка структуры
    if (!isAuthPayload(payload)) {
      throw new AppError("Неверная структура токена", 401);
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Неверный токен", 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Срок действия токена истёк", 401));
    } else {
      next(error);
    }
  }
};
