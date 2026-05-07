import { PaymentMethod, PaymentStatus, RefundStatus } from "../../generated/prisma/client";

export interface KassaAmount {
  value: string;
  currency: "RUB";
}

export interface KassaReceiptItem {
  description: string;
  amount: KassaAmount;
  vat_code: 12;
  quantity: number;
  payment_subject: "service";
  payment_mode: "full_payment";
}

export interface KassaReceipt {
  customer: {
    email: string;
    phone?: string;
  };
  items: KassaReceiptItem[];
  internet: true;
}

export interface KassaStatement {
  type: "payment_overview";
  delivery_method: {
    type: "email";
    email: string;
  }
}

export interface KassaPaymentRequest {
  amount: KassaAmount;
  description: string;
  receipt: KassaReceipt;
  confirmation: {
    type: "redirect";
    locale: "ru_RU";
    return_url: string;
  };
  capture: true;
  metadata: Record<string, string>;
  statements?: KassaStatement[];
}

export interface KassaPaymentResponse {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: KassaAmount;
  income_amount: KassaAmount;
  description?: string;
  payment_method?: {
    type: string;
    id?: string;
    saved?: boolean;
  };
  created_at: string;
  expires_at?: string;
  confirmation?: {
    type: string;
    confirmation_url?: string;
    return_url?: string;
  };
  test: boolean;
  refunded_amount?: KassaAmount;
  paid: boolean;
  refundable: boolean;
  receipt_registration?: "pending" | "succeeded" | "canceled";
  metadata?: Record<string, string>;
  cancellation_details?: {
    party: string;
    reason: string;
  };
  [key: string]: unknown;
}

export interface PaymentResponse {
  paymentId: number;
  reservationId: number;
  amount: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  kassaPaymentId: string | null;
  confirmationUrl?: string;
}

export interface KassaRefundRequest {
  payment_id: string;
  amount: KassaAmount;
  description?: string;
  receipt: KassaReceipt;
  metadata?: Record<string, string>;
}

export interface KassaRefundResponse {
  id: string;
  payment_id: string;
  status: "pending" | "succeeded" | "canceled";
  cancellation_details?: {
    party: "yoo_money" | "refund_network";
    reason:
      | "general_decline"
      | "insufficient_funds"
      | "rejected_by_payee"
      | "rejected_by_timeout"
      | "yoo_money_account_closed";
  };
  receipt_registration?: "pending" | "succeeded" | "canceled";
  created_at: string;
  amount: KassaAmount;
  description?: string;
  refund_authorization_details?: {
    rrn: string;
  };
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

export interface RefundResponse {
  refundId: number;
  paymentId: number;
  refundAmount: string;
  status: RefundStatus;
  kassaRefundId: string | null;
}

export interface KassaReceiptResponse {
  id: string;
  type: "payment" | "refund";
  payment_id?: string;
  refund_id?: string;
  status?: "pending" | "succeeded" | "canceled";
  [key: string]: unknown;
}

export interface KassaErrorResponse {
  type: "error";
  id: string;
  code: string;
  description?: string;
  parameter?: string;
}

export interface KassaWebhookPayload {
  type: "notification";
  event:
    | "payment.succeeded"
    | "payment.canceled"
    | "payment.waiting_for_capture"
    | "refund.succeeded";
  object: {
    id: string;
    status: string;
    [key: string]: unknown;
  };
}