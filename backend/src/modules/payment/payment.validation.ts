import { z } from "zod";

export const initiatePaymentSchema = z.object({
  reservationId: z
    .number()
    .int()
    .positive("Reservation ID must be a positive integer"),
});

export const refundPaymentSchema = z.object({
  paymentId: z.number().int().positive("Payment ID must be a positive integer"),
  amount: z.number().positive("Refund amount must be positive").optional(),
  reason: z.string().min(3, "Reason must be at least 3 characters").optional(),
});

export const webhookPayloadSchema = z.object({
  type: z.string(),
  event: z.string(),
  object: z
    .object({
      id: z.string(),
      status: z.string(),
      amount: z
        .object({
          value: z.string(),
          currency: z.string(),
        })
        .optional(),
      metadata: z
        .object({
          reservationId: z.string().optional(),
          idempotencyKey: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const paymentStatusQuerySchema = z.object({
  paymentId: z.number().int().positive("Payment ID must be a positive integer"),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type WebhookPayloadInput = z.infer<typeof webhookPayloadSchema>;
export type PaymentStatusQueryInput = z.infer<typeof paymentStatusQuerySchema>;
