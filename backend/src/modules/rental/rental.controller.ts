import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { rentalService } from "./rental.service";
import {
  listRentalPriceRulesQuerySchema,
  rentalItemSchema,
  rentalPriceRuleSchema,
  updateRentalItemSchema,
  updateRentalPriceRuleSchema,
} from "./rental.validation";

export const rentalController = {
  listItems: asyncHandler(async (_req: Request, res: Response) => {
    const items = await rentalService.listRentalItems();
    res.json({ success: true, data: items });
  }),

  getItemById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "rental item");
    const item = await rentalService.getRentalItemById(id);
    res.json({ success: true, data: item });
  }),

  createItem: asyncHandler(async (req: Request, res: Response) => {
    const payload = rentalItemSchema.parse(req.body);
    const item = await rentalService.createRentalItem(payload);
    res.status(201).json({ success: true, data: item });
  }),

  updateItem: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "rental item");
    const payload = updateRentalItemSchema.parse(req.body);
    const item = await rentalService.updateRentalItem(id, payload);
    res.json({ success: true, data: item });
  }),

  deleteItem: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "rental item");
    await rentalService.deleteRentalItem(id);
    res.status(204).send();
  }),

  listPriceRules: asyncHandler(async (req: Request, res: Response) => {
    const query = listRentalPriceRulesQuerySchema.parse({
      rentalItemId: typeof req.query.rentalItemId === "string" ? req.query.rentalItemId : undefined,
    });
    const rules = await rentalService.listPriceRules(query);
    res.json({ success: true, data: rules });
  }),

  createPriceRule: asyncHandler(async (req: Request, res: Response) => {
    const payload = rentalPriceRuleSchema.parse(req.body);
    const rule = await rentalService.createPriceRule(payload);
    res.status(201).json({ success: true, data: rule });
  }),

  updatePriceRule: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "rental price rule");
    const payload = updateRentalPriceRuleSchema.parse(req.body);
    const rule = await rentalService.updatePriceRule(id, payload);
    res.json({ success: true, data: rule });
  }),

  deletePriceRule: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "rental price rule");
    await rentalService.deletePriceRule(id);
    res.status(204).send();
  }),
};
