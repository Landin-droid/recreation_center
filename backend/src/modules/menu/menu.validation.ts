import { MenuCategory } from "../../generated/prisma/client";
import { z } from "zod";
import { decimalSchema } from "../../common/validation";

export const menuItemSchema = z.object({
  name: z.string().trim().min(2),
  price: decimalSchema,
  description: z.string().trim().optional(),
  isAvailable: z.boolean().optional(),
  category: z.nativeEnum(MenuCategory).optional().nullable(),
});

export const updateMenuItemSchema = menuItemSchema.partial();

export const menuAssignmentSchema = z.object({
  bookableObjectId: z.coerce.number().int().positive(),
  menuItemId: z.coerce.number().int().positive(),
  isAvailable: z.boolean().optional(),
});

export const listMenuAssignmentsQuerySchema = z.object({
  bookableObjectId: z.coerce.number().int().positive().optional(),
});

export type CreateMenuItemInput = z.infer<typeof menuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type MenuAssignmentInput = z.infer<typeof menuAssignmentSchema>;
export type ListMenuAssignmentsQuery = z.infer<typeof listMenuAssignmentsQuerySchema>;
