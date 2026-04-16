import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { bookableObjectService } from "./bookable-object.service";
import {
  createBookableObjectSchema,
  listBookableObjectsQuerySchema,
  updateBookableObjectSchema,
} from "./bookable-object.validation";

export const bookableObjectController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = listBookableObjectsQuerySchema.parse({
      type: typeof req.query.type === "string" ? req.query.type : undefined,
      isActive: typeof req.query.isActive === "string" ? req.query.isActive : undefined,
    });

    const objects = await bookableObjectService.listBookableObjects(query);
    res.json({ success: true, data: objects });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "bookable object");
    const object = await bookableObjectService.getBookableObjectById(id);
    res.json({ success: true, data: object });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payload = createBookableObjectSchema.parse(req.body);
    const object = await bookableObjectService.createBookableObject(payload);
    res.status(201).json({ success: true, data: object });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "bookable object");
    const payload = updateBookableObjectSchema.parse(req.body);
    const object = await bookableObjectService.updateBookableObject(id, payload);
    res.json({ success: true, data: object });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "bookable object");
    await bookableObjectService.deleteBookableObject(id);
    res.status(204).send();
  }),
};
