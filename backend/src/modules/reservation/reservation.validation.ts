import { ReservationStatus } from "../../generated/prisma/client";
import { z } from "zod";
import { dateStringSchema, positiveIntSchema } from "../../common/validation";

export const reservationMenuItemSchema = z.object({
  menuItemId: positiveIntSchema,
  quantity: positiveIntSchema,
});

export const reservationSchema = z.object({
  userId: positiveIntSchema,
  bookableObjectId: positiveIntSchema,
  reservationDate: dateStringSchema,
  guestsCount: positiveIntSchema,
  notes: z.string().trim().optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  cancellationReason: z.string().trim().optional(),
  menuItems: z.array(reservationMenuItemSchema).optional().default([]),
});

export const updateReservationSchema = z.object({
  userId: positiveIntSchema.optional(),
  bookableObjectId: positiveIntSchema.optional(),
  reservationDate: dateStringSchema.optional(),
  guestsCount: positiveIntSchema.optional(),
  notes: z.string().trim().optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  cancellationReason: z.string().trim().optional(),
  menuItems: z.array(reservationMenuItemSchema).optional(),
});

export const listReservationsQuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  bookableObjectId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
});

export type ReservationMenuItemInput = z.infer<
  typeof reservationMenuItemSchema
>;
export type CreateReservationInput = z.infer<typeof reservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ListReservationsQuery = z.infer<typeof listReservationsQuerySchema>;
