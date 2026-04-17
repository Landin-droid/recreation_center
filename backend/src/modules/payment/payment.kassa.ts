import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { env } from "../../config/env";
import {
  KassaPaymentRequest,
  KassaPaymentResponse,
  WebhookPayload,
} from "./payment.types";

class YookassaClient {
  private axiosInstance: AxiosInstance;
  private shopId: string;
  private apiKey: string;
  private webhookSecret: string;
  private baseURL = "https://api.yookassa.ru/v3";

  constructor() {
    this.shopId = env.YOOKASSA_SHOP_ID || "";
    this.apiKey = env.YOOKASSA_API_KEY || "";
    this.webhookSecret = env.YOOKASSA_WEBHOOK_SECRET || "";

    // Базовая конфигурация axios
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": this.generateIdempotencyKey(),
      },
      auth: {
        username: this.shopId,
        password: this.apiKey,
      },
    });

    // Error interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error("ЮKassa: Invalid shop ID or API key");
        }
        if (error.response?.status === 400) {
          const details = error.response.data?.details || [];
          const errorMessage = details
            .map((d: any) => d.description)
            .join("; ");
          throw new Error(`ЮKassa: ${errorMessage}`);
        }
        if (error.code === "ECONNABORTED") {
          throw new Error("ЮKassa API timeout");
        }
        throw error;
      },
    );
  }

  /**
   * Создать платёж в ЮKassa
   */
  async createPayment(
    request: KassaPaymentRequest,
    idempotencyKey: string,
  ): Promise<KassaPaymentResponse> {
    try {
      const response = await this.axiosInstance.post<KassaPaymentResponse>(
        "/payments",
        {
          amount: {
            value: (request.amount / 100).toFixed(2),
            currency: request.currency,
          },
          confirmation: request.confirmation,
          capture: request.capture,
          description: request.description,
          metadata: request.metadata,
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("ЮKassa createPayment error:", error);
      throw error;
    }
  }

  /**
   * Получить информацию о платеже
   */
  async getPaymentStatus(paymentId: string): Promise<KassaPaymentResponse> {
    try {
      const response = await this.axiosInstance.get<KassaPaymentResponse>(
        `/payments/${paymentId}`,
      );
      return response.data;
    } catch (error) {
      console.error("ЮKassa getPaymentStatus error:", error);
      throw error;
    }
  }

  /**
   * Создать возврат (полный или частичный)
   */
  async createRefund(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundRequest: any = {
        payment_id: paymentId,
      };

      // Если указана сумма - частичный возврат (в копейках)
      if (amount) {
        refundRequest.amount = {
          value: (amount / 100).toFixed(2),
          currency: "RUB",
        };
      }

      const response = await this.axiosInstance.post(
        "/refunds",
        refundRequest,
        {
          headers: {
            "Idempotency-Key": this.generateIdempotencyKey(),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("ЮKassa createRefund error:", error);
      throw error;
    }
  }

  /**
   * Получить информацию о возврате
   */
  async getRefundStatus(refundId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/refunds/${refundId}`);
      return response.data;
    } catch (error) {
      console.error("ЮKassa getRefundStatus error:", error);
      throw error;
    }
  }

  /**
   * Проверить подпись вебхука (для безопасности)
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("base64");

      return hash === signature;
    } catch (error) {
      console.error("ЮKassa verifyWebhookSignature error:", error);
      return false;
    }
  }

  /**
   * Сгенерировать уникальный ключ идемпотентности
   */
  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Проверить готовность клиента
   */
  isReady(): boolean {
    return !!(this.shopId && this.apiKey);
  }
}

export const kassaClient = new YookassaClient();
