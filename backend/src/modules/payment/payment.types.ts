import {
  PaymentStatus,
  PaymentMethod,
  RefundStatus,
  CancellationReasonCode,
} from "@prisma/client";

export interface PaymentResponse {
  paymentId: number;
  invoiceId: number;
  reservationId: number;
  amount: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  kassaPaymentId: string | null;
  createdAt: string;
}

export interface KassaPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  capture: boolean;
  confirmation: {
    type: string;
    return_url: string;
  };
  metadata?: {
    reservationId: string;
    invoiceId: string;
    idempotencyKey: string;
  };
}

export interface KassaPaymentResponse {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
    return_url?: string;
  };
  created_at: string;
  description: string;
  receipt_registration?: string;
  test?: boolean;
}

export interface RefundRequest {
  paymentId: number;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  refundId: number;
  paymentId: number;
  refundAmount: string;
  status: RefundStatus;
  kassaRefundId: string | null;
}

export interface CancellationExpenseRecord {
  expenseId: number;
  expenseType: string;
  amount: string;
  description: string | null;
  receiptUrl: string | null;
  supplierName: string | null;
}

export interface WebhookPayload {
  type: string;
  event: string;
  object?: {
    id: string;
    status: string;
    amount?: {
      value: string;
      currency: string;
    };
    metadata?: {
      reservationId: string;
      idempotencyKey: string;
    };
  };
}
