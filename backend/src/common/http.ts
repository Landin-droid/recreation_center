import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../middleware/errorHandler";

export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export const parseIdParam = (value: string, entityName = "entity"): number => {
  const id = Number.parseInt(value, 10);

  if (Number.isNaN(id) || id <= 0) {
    throw new AppError(`Некорректный идентификатор сущности "${entityName}"`, 400);
  }

  return id;
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: "Маршрут не найден",
  });
};
