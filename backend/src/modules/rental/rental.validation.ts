import { PassengerType, RentalCategory, RentalSeasonType } from "@prisma/client";
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

export const rentalPriceRuleSchema = z.object({
  rentalItemId: positiveIntSchema,
  pricePerKm: positiveDecimalSchema,
  minKm: positiveIntSchema.optional(),
  maxKm: positiveIntSchema.optional().nullable(),
  passengerType: z.nativeEnum(PassengerType),
});

export const updateRentalPriceRuleSchema = rentalPriceRuleSchema.partial();

export const listRentalPriceRulesQuerySchema = z.object({
  rentalItemId: z.coerce.number().int().positive().optional(),
});

export type CreateRentalItemInput = z.infer<typeof rentalItemSchema>;
export type UpdateRentalItemInput = z.infer<typeof updateRentalItemSchema>;
export type CreateRentalPriceRuleInput = z.infer<typeof rentalPriceRuleSchema>;
export type UpdateRentalPriceRuleInput = z.infer<typeof updateRentalPriceRuleSchema>;
export type ListRentalPriceRulesQuery = z.infer<typeof listRentalPriceRulesQuerySchema>;
