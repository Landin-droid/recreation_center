import { z } from "zod";

export const createPaymentSchema = z.object({
  reservationId: z
    .number()
    .int()
    .positive("Reservation ID must be a positive integer"),
});

export const createRefundSchema = z.object({
  paymentId: z.number().int().positive("Payment ID must be a positive integer"),
  reason: z.string().trim().min(3).max(250).optional(),
});

export const webhookPayloadSchema = z.object({
  type: z.string(),
  event: z.enum([
    "payment.succeeded",
    "payment.canceled",
    "payment.waiting_for_capture",
    "refund.succeeded",
  ]),
  object: z
    .object({
      id: z.string(),
      status: z.string(),
    })
    .passthrough(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type WebhookPayloadInput = z.infer<typeof webhookPayloadSchema>;
