import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { menuService } from "./menu.service";
import {
  listMenuAssignmentsQuerySchema,
  menuAssignmentSchema,
  menuItemSchema,
  updateMenuItemSchema,
} from "./menu.validation";

export const menuController = {
  listItems: asyncHandler(async (_req: Request, res: Response) => {
    const items = await menuService.listMenuItems();
    res.json({ success: true, data: items });
  }),

  getItemById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "menu item");
    const item = await menuService.getMenuItemById(id);
    res.json({ success: true, data: item });
  }),

  createItem: asyncHandler(async (req: Request, res: Response) => {
    const payload = menuItemSchema.parse(req.body);
    const item = await menuService.createMenuItem(payload);
    res.status(201).json({ success: true, data: item });
  }),

  updateItem: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "menu item");
    const payload = updateMenuItemSchema.parse(req.body);
    const item = await menuService.updateMenuItem(id, payload);
    res.json({ success: true, data: item });
  }),

  deleteItem: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "menu item");
    await menuService.deleteMenuItem(id);
    res.status(204).send();
  }),

  listAssignments: asyncHandler(async (req: Request, res: Response) => {
    const query = listMenuAssignmentsQuerySchema.parse({
      bookableObjectId:
        typeof req.query.bookableObjectId === "string" ? req.query.bookableObjectId : undefined,
    });
    const assignments = await menuService.listAssignments(query);
    res.json({ success: true, data: assignments });
  }),

  upsertAssignment: asyncHandler(async (req: Request, res: Response) => {
    const payload = menuAssignmentSchema.parse(req.body);
    const assignment = await menuService.upsertAssignment(payload);
    res.status(201).json({ success: true, data: assignment });
  }),

  deleteAssignment: asyncHandler(async (req: Request, res: Response) => {
    const bookableObjectId = parseIdParam(String(req.params.bookableObjectId), "bookable object");
    const menuItemId = parseIdParam(String(req.params.menuItemId), "menu item");
    await menuService.deleteAssignment(bookableObjectId, menuItemId);
    res.status(204).send();
  }),
};
