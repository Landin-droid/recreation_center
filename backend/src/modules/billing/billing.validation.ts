import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { dateStringSchema, positiveDecimalSchema } from "../../common/validation";

export const invoiceSchema = z.object({
  reservationId: z.coerce.number().int().positive(),
  dueDate: dateStringSchema,
  totalAmount: positiveDecimalSchema.optional(),
});

export const updateInvoiceSchema = invoiceSchema.partial();

export const paymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  amount: positiveDecimalSchema.optional(),
  transactionId: z.string().trim().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional().nullable(),
  chequeUrl: z.string().trim().url().optional(),
});

export const updatePaymentSchema = paymentSchema.partial();

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof paymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
