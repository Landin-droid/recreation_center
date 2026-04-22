import {
  PaymentStatus,
  PaymentMethod,
  RefundStatus,
  CancellationReasonCode,
} from "../../generated/prisma/client";

/**
 * Типы согласно официальной документации Yookassa
 * https://yookassa.ru/developers/api
 */

/**
 * Платёж в нашей системе
 */
export interface PaymentResponse {
  paymentId: number;
  reservationId: number;
  amount: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  kassaPaymentId: string | null;
  createdAt: string;
}

/**
 * Запрос на создание платежа в Yookassa
 *
 * https://yookassa.ru/developers/api#create-payment
 */
export interface KassaPaymentRequest {
  amount: number; // В копейках
  currency: string; // ISO-4217, обычно "RUB"
  description?: string; // Описание платежа (макс 128 символов)
  capture?: boolean; // true = один этап, false = два этапа (capture требуется позже)
  confirmation?: {
    type?: string; // "redirect" для веб-платежей
    return_url: string; // URL возврата после платежа
  };
  metadata?: Record<string, string>; // Дополнительные данные (макс 16 ключей)
}

/**
 * Статусы платежа согласно документации:
 * - pending: Ожидает подтверждения пользователя
 * - waiting_for_capture: Авторизован, требует capture (двухэтапный платёж)
 * - succeeded: Успешно завершён
 * - canceled: Отменён
 *
 * https://yookassa.ru/developers/api#payment-object
 */
export interface KassaPaymentResponse {
  id: string; // ID платежа в Yookassa
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: {
    value: string; // Строка с точкой (e.g., "100.00")
    currency: string;
  };
  paid: boolean; // true если статус succeeded или waiting_for_capture
  refundable: boolean; // Возможен ли возврат
  confirmation?: {
    type: string;
    confirmation_url?: string; // URL для редиректа пользователя
    return_url?: string;
    confirmation_token?: string;
  };
  created_at: string; // ISO 8601
  expires_at?: string; // Истекает в (для pending платежей)
  captured_at?: string; // Время захвата
  description?: string;
  receipt_registration?: "pending" | "succeeded" | "canceled";
  metadata?: Record<string, string>;
  payment_method?: {
    type: string;
    id: string;
    saved: boolean;
    card?: {
      first6: string;
      last4: string;
      expiry_month: string;
      expiry_year: string;
      card_type: string;
    };
  };
  recipient?: {
    account_id: string;
    gateway_id?: string;
  };
  test: boolean;
  refunded_amount?: {
    value: string;
    currency: string;
  };
  cancellation_details?: {
    party: "yoo_money" | "payment_network" | "merchant";
    reason: string;
  };
}

/**
 * Возврат платежа
 *
 * https://yookassa.ru/developers/api#refund-object
 */
export interface KassaRefundResponse {
  id: string; // ID возврата в Yookassa
  payment_id: string; // ID платежа
  status: "pending" | "succeeded" | "canceled"; // Статусы возврата
  amount: {
    value: string;
    currency: string;
  };
  created_at: string;
  description?: string;
  receipt_registration?: "pending" | "succeeded" | "canceled";
  metadata?: Record<string, string>;
  cancellation_details?: {
    party: "yoo_money" | "payment_network" | "merchant";
    reason: string;
  };
}

/**
 * Ошибка от Yookassa API
 *
 * https://yookassa.ru/developers/using-api/response-handling/response-format
 */
export interface KassaErrorResponse {
  type: "error";
  id: string; // ID ошибки для техподдержки
  code:
    | "invalid_request"
    | "invalid_credentials"
    | "forbidden"
    | "not_found"
    | "too_many_requests"
    | "internal_server_error";
  description: string;
  parameter?: string; // Параметр, вызвавший ошибку
}

/**
 * Payload вебхука от Yookassa
 */
export interface KassaWebhookPayload {
  type: string; // e.g., "payment.succeeded", "payment.canceled"
  event: string;
  object: {
    id: string;
    status: string;
    [key: string]: any;
  };
}

/**
 * Внутреннее представление платежа Yookassa
 */
export interface YookassaPaymentInfo {
  id: string;
  status: KassaPaymentResponse["status"];
  amount: number; // В копейках
  currency: string;
  paidAt?: Date;
  cancelledAt?: Date;
  refundedAmount?: number;
  description?: string;
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
