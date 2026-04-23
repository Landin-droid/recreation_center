import axios, { AxiosInstance, AxiosError } from "axios";
import crypto from "crypto";
import { env } from "../../config/env";
import {
  KassaPaymentRequest,
  KassaPaymentResponse,
  KassaRefundResponse,
  KassaErrorResponse,
} from "./payment.types";

/**
 * Yookassa API Client v3
 * Следует официальной документации: https://yookassa.ru/developers/using-api/
 *
 * Ключевые моменты:
 * 1. HTTP Basic Auth: Shop ID как username, Secret Key как password
 * 2. Idempotence: Каждый POST/DELETE запрос требует Idempotence-Key
 * 3. Amount: Передаётся как строка с точкой (e.g., "10.00")
 * 4. Response codes: 200 (успех), 400-429 (ошибки), 500 (retry)
 */
class YookassaClient {
  private axiosInstance: AxiosInstance;
  private shopId: string;
  private apiKey: string;
  private webhookSecret: string;
  private readonly baseURL = "https://api.yookassa.ru/v3";
  private readonly API_TIMEOUT = 30000; // 30 сек по документации

  constructor() {
    this.shopId = env.YOOKASSA_SHOP_ID || "";
    this.apiKey = env.YOOKASSA_API_KEY || "";
    this.webhookSecret = env.YOOKASSA_WEBHOOK_SECRET || "";

    // Базовая конфигурация axios с HTTP Basic Auth
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: this.shopId,
        password: this.apiKey,
      },
    });

    // Response interceptor для обработки ошибок по рекомендациям документации
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error),
    );
  }

  /**
   * Обработка ошибок согласно документации
   * https://yookassa.ru/developers/using-api/response-handling/http-codes
   */
  private handleError(error: AxiosError): never {
    const status = error.response?.status;
    const data = error.response?.data as KassaErrorResponse | undefined;

    switch (status) {
      case 400:
        throw new Error(
          `Invalid request (400): ${data?.description || "Bad request"}. Parameter: ${data?.parameter || "unknown"}`,
        );
      case 401:
        throw new Error(
          `Invalid credentials (401): Check Shop ID and API Key. Details: ${data?.description || "Authentication failed"}`,
        );
      case 403:
        throw new Error(
          `Forbidden (403): Not enough rights. Details: ${data?.description || "Permission denied"}`,
        );
      case 404:
        throw new Error(
          `Resource not found (404): ${data?.description || "Not found"}. Parameter: ${data?.parameter || "unknown"}`,
        );
      case 429:
        throw new Error(
          `Too many requests (429): Rate limit exceeded. Retry with exponential backoff.`,
        );
      case 500:
        throw new Error(
          `Server error (500): Technical difficulties. Retry with same Idempotence-Key.`,
        );
      default:
        if (error.code === "ECONNABORTED") {
          throw new Error(
            "Request timeout: API did not respond within 30 seconds.",
          );
        }
        throw new Error(
          `Yookassa API error: ${error.message || "Unknown error"}`,
        );
    }
  }

  /**
   * Создать платёж в Yookassa
   *
   * https://yookassa.ru/developers/api#create-payment
   *
   * Статусы платежа согласно документации:
   * - pending: Платёж создан, ожидает подтверждения пользователя
   * - waiting_for_capture: Платёж авторизован, требует подтверждения (capture)
   * - succeeded: Платёж успешно завершён
   * - canceled: Платёж отменён
   */
  async createPayment(
    request: KassaPaymentRequest,
    idempotencyKey: string,
  ): Promise<KassaPaymentResponse> {
    try {
      // Валидация необходимых параметров
      if (!request.amount || request.amount <= 0) {
        throw new Error("Invalid amount: must be greater than 0");
      }
      if (!request.currency) {
        throw new Error("Currency is required (e.g., 'RUB')");
      }
      if (!request.confirmation?.return_url) {
        throw new Error("Confirmation return URL is required");
      }

      // Формирование запроса согласно документации
      const paymentPayload = {
        amount: {
          value: (request.amount / 100).toFixed(2), // Преобразование из копеек в рубли
          currency: request.currency,
        },
        confirmation: {
          type: request.confirmation.type || "redirect",
          return_url: request.confirmation.return_url,
        },
        capture: request.capture !== false, // По умолчанию true (один этап)
        description: request.description || "Payment",
        metadata: request.metadata || {},
      };

      const response = await this.axiosInstance.post<KassaPaymentResponse>(
        "/payments",
        paymentPayload,
        {
          headers: {
            "Idempotence-Key": idempotencyKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to create payment:", error);
      throw error;
    }
  }

  /**
   * Получить статус платежа
   *
   * https://yookassa.ru/developers/api#get-payment
   *
   * Используется для проверки текущего статуса платежа
   */
  async getPaymentStatus(paymentId: string): Promise<KassaPaymentResponse> {
    try {
      if (!paymentId) {
        throw new Error("Payment ID is required");
      }

      const response = await this.axiosInstance.get<KassaPaymentResponse>(
        `/payments/${paymentId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get payment status:", error);
      throw error;
    }
  }

  /**
   * Захватить (подтвердить) платёж в два этапа
   *
   * https://yookassa.ru/developers/api#capture-payment
   *
   * Используется для двухэтапных платежей (capture: false при создании)
   * Статусы:
   * - waiting_for_capture -> succeeded (при успехе)
   * - waiting_for_capture -> canceled (при отмене или истечении времени)
   */
  async capturePayment(
    paymentId: string,
    idempotencyKey: string,
    amount?: number,
  ): Promise<KassaPaymentResponse> {
    try {
      if (!paymentId) {
        throw new Error("Payment ID is required");
      }

      const payload: any = {};

      if (amount) {
        payload.amount = {
          value: (amount / 100).toFixed(2),
          currency: "RUB",
        };
      }

      const response = await this.axiosInstance.post<KassaPaymentResponse>(
        `/payments/${paymentId}/capture`,
        payload,
        {
          headers: {
            "Idempotence-Key": idempotencyKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to capture payment:", error);
      throw error;
    }
  }

  /**
   * Отменить платёж
   *
   * https://yookassa.ru/developers/api#cancel-payment
   *
   * Используется для отмены платежей в статусе waiting_for_capture
   */
  async cancelPayment(
    paymentId: string,
    idempotencyKey: string,
  ): Promise<KassaPaymentResponse> {
    try {
      if (!paymentId) {
        throw new Error("Payment ID is required");
      }

      const response = await this.axiosInstance.post<KassaPaymentResponse>(
        `/payments/${paymentId}/cancel`,
        {},
        {
          headers: {
            "Idempotence-Key": idempotencyKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to cancel payment:", error);
      throw error;
    }
  }

  /**
   * Создать возврат платежа (полный или частичный)
   *
   * https://yookassa.ru/developers/api#create-refund
   *
   * Возвраты:
   * - Статусы: pending, succeeded, canceled
   * - Возможен в течение 3 лет с момента создания платежа
   * - Полный возврат: без параметра amount
   * - Частичный возврат: с параметром amount
   * - Комиссия Yookassa не возвращается
   */
  async createRefund(
    paymentId: string,
    idempotencyKey: string,
    amount?: number,
    description?: string,
  ): Promise<KassaRefundResponse> {
    try {
      if (!paymentId) {
        throw new Error("Payment ID is required");
      }

      const refundPayload: any = {
        payment_id: paymentId,
      };

      if (amount && amount > 0) {
        refundPayload.amount = {
          value: (amount / 100).toFixed(2),
          currency: "RUB",
        };
      }

      if (description) {
        refundPayload.description = description;
      }

      const response = await this.axiosInstance.post<KassaRefundResponse>(
        "/refunds",
        refundPayload,
        {
          headers: {
            "Idempotence-Key": idempotencyKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to create refund:", error);
      throw error;
    }
  }

  /**
   * Получить статус возврата
   *
   * https://yookassa.ru/developers/api#get-refund
   */
  async getRefundStatus(refundId: string): Promise<KassaRefundResponse> {
    try {
      if (!refundId) {
        throw new Error("Refund ID is required");
      }

      const response = await this.axiosInstance.get<KassaRefundResponse>(
        `/refunds/${refundId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get refund status:", error);
      throw error;
    }
  }

  /**
   * Проверить подпись вебхука для безопасности
   *
   * https://yookassa.ru/developers/using-api/webhooks
   *
   * Signature: v1 <SHA-256>
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!signature || !this.webhookSecret) {
        return false;
      }

      // Формат: "v1 <хеш>"
      const [version, hash] = signature.split(" ");
      if (version !== "v1") {
        return false;
      }

      const expectedHash = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("hex");

      return hash === expectedHash;
    } catch (error) {
      console.error("Failed to verify webhook signature:", error);
      return false;
    }
  }

  /**
   * Сгенерировать уникальный ключ идемпотентности
   *
   * https://yookassa.ru/developers/using-api/interaction-format#idempotence
   *
   * Требования:
   * - Максимум 64 символа
   * - Уникален для каждой операции
   * - Рекомендуется UUID v4
   */
  generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Проверить готовность клиента (настроены ли учётные данные)
   */
  isReady(): boolean {
    return !!(this.shopId && this.apiKey);
  }

  /**
   * Получить Shop ID (для логирования)
   */
  getShopId(): string {
    return this.shopId;
  }
}

export const kassaClient = new YookassaClient();
