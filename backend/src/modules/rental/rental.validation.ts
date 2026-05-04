import {
  PassengerType,
  RentalCategory,
  RentalSeasonType,
} from "../../generated/prisma/client";
import { z } from "zod";
import {
  decimalSchema,
  positiveDecimalSchema,
  positiveIntSchema,
} from "../../common/validation";

export const rentalItemSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  pricePerHour: decimalSchema.optional().nullable(),
  isSeasonal: z.boolean().optional(),
  maxCapacity: positiveIntSchema.optional().nullable(),
  imageUrl: z.string().trim().url().optional(),
  isActive: z.boolean().optional(),
  category: z.nativeEnum(RentalCategory),
  seasonType: z.nativeEnum(RentalSeasonType).optional().nullable(),
});

export const updateRentalItemSchema = rentalItemSchema.partial();

const validateKmRange = (
  data: { minKm?: number; maxKm?: number | null },
  ctx: z.RefinementCtx,
) => {
  if (data.maxKm !== null && data.maxKm !== undefined && data.minKm !== undefined) {
    if (data.maxKm < data.minKm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxKm"],
        message: "maxKm must be greater than or equal to minKm",
      });
    }
  }
};

const rentalPriceRuleBaseSchema = z.object({
  rentalItemId: positiveIntSchema,
  pricePerKm: positiveDecimalSchema,
  minKm: positiveIntSchema.default(1),
  maxKm: decimalSchema.optional().nullable(),
  passengerType: z.nativeEnum(PassengerType),
});

export const rentalPriceRuleSchema = rentalPriceRuleBaseSchema.superRefine(validateKmRange);

export const updateRentalPriceRuleSchema = rentalPriceRuleBaseSchema
  .partial()
  .superRefine(validateKmRange);

export const listRentalPriceRulesQuerySchema = z.object({
  rentalItemId: z.coerce.number().int().positive().optional(),
});

export type CreateRentalItemInput = z.infer<typeof rentalItemSchema>;
export type UpdateRentalItemInput = z.infer<typeof updateRentalItemSchema>;
export type CreateRentalPriceRuleInput = z.infer<typeof rentalPriceRuleSchema>;
export type UpdateRentalPriceRuleInput = z.infer<typeof updateRentalPriceRuleSchema>;
export type ListRentalPriceRulesQuery = z.infer<typeof listRentalPriceRulesQuerySchema>;
