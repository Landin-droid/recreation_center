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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization header is missing or invalid", 401);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError("Token is missing", 401);
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
