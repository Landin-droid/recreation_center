import { paymentRepository } from "./payment.repository";
import { kassaClient } from "./payment.kassa";
import { env } from "../../config/env";
import prisma from "../../lib/prisma";
import dayjs from "dayjs";
import crypto from "crypto";
import { Prisma } from "../../generated/prisma/client";
import { KassaPaymentResponse, KassaRefundResponse } from "./payment.types";

/**
 * Payment Service
 *
 * Следует рекомендациям Yookassa:
 * https://yookassa.ru/developers/using-api/response-handling/recommendations
 *
 * Правила обработки ответов:
 * 1. HTTP 200 + статус succeeded/final -> успех
 * 2. HTTP 200 + статус pending -> ждём notification или retry позже
 * 3. HTTP 200 + статус canceled -> ошибка, запросить новые данные от пользователя
 * 4. HTTP 4XX -> ошибка, retry с новыми данными и новым Idempotence-Key
 * 5. HTTP 500 -> неизвестный результат, retry с тем же Idempotence-Key
 */
/**
 * Helper: преобразовать тип события Yookassa в формат БД
 * "payment.succeeded" -> "payment_succeeded"
 */
function normalizeEventType(eventType: string): string {
  return eventType.replace(/\./g, "_").toLowerCase();
}
class PaymentService {
  /**
   * Инициировать платёж (создание объекта Payment в Yookassa)
   *
   * https://yookassa.ru/developers/api#create-payment
   *
   * Возвращает URL для редиректа на платёжную форму
   */
  async initiatePayment(reservationId: number): Promise<{
    paymentId: number;
    confirmationUrl: string;
    paymentDeadline: Date;
  }> {
    try {
      // 1. Найти и валидировать бронирование
      const reservation = await prisma.reservation.findUnique({
        where: { reservationId },
        include: {
          user: true,
          bookableObject: true,
        },
      });

      if (!reservation) {
        throw new Error(`Reservation ${reservationId} not found`);
      }

      if (reservation.totalSum.toNumber() <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }

      // 2. Проверить, не создан ли уже активный платёж
      // TODO: Implement findPaymentByReservationId in repository if needed
      // For now, we'll skip this check and let subsequent calls handle duplicates

      // 3. Генерировать ключ идемпотентности
      const idempotencyKey = kassaClient.generateIdempotencyKey();

      // 4. Создать запись платежа в БД в статусе pending
      const payment = await paymentRepository.createPayment({
        reservationId,
        amount: new Prisma.Decimal(reservation.totalSum.toString()),
        idempotencyKey,
      });

      // 5. Установить deadline платежа
      const paymentDeadline = dayjs()
        .add(env.PAYMENT_TIMEOUT_MINUTES || 15, "minute")
        .toDate();

      await prisma.reservation.update({
        where: { reservationId },
        data: { paymentDeadline },
      });

      // 6. Отправить запрос в Yookassa (если клиент настроен)
      if (!kassaClient.isReady()) {
        console.warn("Yookassa not configured - test mode");
        return {
          paymentId: payment.paymentId,
          confirmationUrl: `${env.PAYMENT_SUCCESS_REDIRECT}?paymentId=${payment.paymentId}`,
          paymentDeadline,
        };
      }

      try {
        const kassaRequest = {
          amount: Math.round(reservation.totalSum.toNumber() * 100), // копейки
          currency: "RUB",
          description: `Бронирование ${reservation.bookableObject.name} на ${dayjs(
            reservation.reservationDate,
          ).format("DD.MM.YYYY")}`,
          capture: true, // Одноэтапный платёж
          confirmation: {
            type: "redirect" as const,
            return_url: env.PAYMENT_SUCCESS_REDIRECT,
          },
          metadata: {
            reservationId: String(reservationId),
          },
        };

        const kassaResponse = await kassaClient.createPayment(
          kassaRequest,
          idempotencyKey,
        );

        // 7. Обновить платёж с данными от Yookassa
        await paymentRepository.updatePaymentStatus(payment.paymentId, {
          status: "pending",
          kassaPaymentId: kassaResponse.id,
        });

        // Согласно документации, confirmation_url будет для redirect типа подтверждения
        const confirmationUrl =
          kassaResponse.confirmation?.confirmation_url ||
          `https://yookassa.ru/checkout/payments/v2/contract?orderId=${kassaResponse.id}`;

        return {
          paymentId: payment.paymentId,
          confirmationUrl,
          paymentDeadline,
        };
      } catch (kassaError) {
        console.error(
          `Failed to create payment in Yookassa for reservation ${reservationId}:`,
          kassaError,
        );

        // Даже если Yookassa не ответила, платёж в нашей БД создан
        // Его статус будет обновлен при получении webhook'a
        throw kassaError;
      }
    } catch (error) {
      console.error(
        `Failed to initiate payment for reservation ${reservationId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Обработать вебхук от Yookassa
   *
   * https://yookassa.ru/developers/using-api/webhooks
   *
   * Согласно документации по response handling:
   * - Проверяем HTTP статус (всегда 200 для вебхуков)
   * - Проверяем статус объекта платежа в вебхуке
   * - Обрабатываем статусы: succeeded, canceled, pending
   */
  async handleWebhook(webhookPayload: any): Promise<void> {
    const source = "yookassa";
    const eventTypeRaw = webhookPayload.event || webhookPayload.type;
    const eventType = normalizeEventType(eventTypeRaw); // "payment.succeeded" -> "payment_succeeded"

    try {
      // 1. Логировать вебхук для отладки
      await paymentRepository.logWebhook({
        source,
        eventType,
        payload: JSON.stringify(webhookPayload),
      });

      // 2. Извлечь и валидировать данные платежа из вебхука
      const kassaPaymentId = webhookPayload.object?.id;
      if (!kassaPaymentId) {
        throw new Error("Payment ID not found in webhook object");
      }

      const paymentStatus = webhookPayload.object?.status;
      if (!paymentStatus) {
        throw new Error("Payment status not found in webhook object");
      }

      // 3. Проверить idempotence - не обработали ли уже этот вебхук
      const existingWebhooks = await paymentRepository.findWebhooksByPayload(
        source,
        eventType,
        kassaPaymentId,
      );

      if (existingWebhooks.length > 1) {
        console.warn(
          `Webhook for payment ${kassaPaymentId} already processed. Ignoring duplicate.`,
        );
        return; // Идемпотентно - просто возвращаем успех
      }

      // 4. Найти платёж в нашей БД
      // Сначала пробуем по kassaPaymentId, затем по reservationId
      let payment =
        await paymentRepository.findPaymentByKassaId(kassaPaymentId);

      if (!payment) {
        throw new Error(
          `Payment ${kassaPaymentId} not found in our database. This might be a payment from another service.`,
        );
      }

      // 5. Обновить статус согласно рекомендациям Yookassa
      // https://yookassa.ru/developers/using-api/response-handling/recommendations

      if (paymentStatus === "succeeded") {
        // Платёж успешно завершён - финальный статус
        console.log(`✓ Payment ${payment.paymentId} succeeded`);

        await paymentRepository.updatePaymentStatus(payment.paymentId, {
          status: "succeeded",
          kassaPaymentId,
        });

        // Обновить статус бронирования
        await paymentRepository.updateReservationStatus(
          payment.reservationId,
          "paid",
        );

        // TODO: Отправить уведомление пользователю
      } else if (paymentStatus === "waiting_for_capture") {
        // Двухэтапный платёж - авторизован, требует захвата
        // Это промежуточный статус - автоматически захватываем (или требуем действия)
        console.log(
          `⏳ Payment ${payment.paymentId} waiting for capture (two-stage)`,
        );

        // Можно автоматически захватить платёж
        if (kassaClient.isReady()) {
          try {
            const captureIdempotencyKey = kassaClient.generateIdempotencyKey();
            await kassaClient.capturePayment(
              kassaPaymentId,
              captureIdempotencyKey,
            );
            // После успешного захвата придёт ещё один вебхук с succeeded статусом
          } catch (error) {
            console.error(
              `Failed to auto-capture payment ${payment.paymentId}:`,
              error,
            );
            // Оставляем платёж в статусе waiting_for_capture
            // Он будет автоматически отменён через 7 дней Yookassa
          }
        }
      } else if (paymentStatus === "canceled") {
        // Платёж отменён - финальный статус
        console.log(`✗ Payment ${payment.paymentId} canceled`);

        const kassaCancellationReason =
          webhookPayload.object?.cancellation_details?.reason || "Unknown reason";
        const cancellationParty =
          webhookPayload.object?.cancellation_details?.party || "Unknown party";

        await paymentRepository.updatePaymentStatus(payment.paymentId, {
          status: "cancelled",
        });

        // Log cancellation details for reference
        const reason = `Yookassa cancellation: ${kassaCancellationReason} (by ${cancellationParty})`;
        console.log(reason);

        await paymentRepository.updateReservationStatus(
          payment.reservationId,
          "cancelled",
          reason
        );

        // TODO: Отправить уведомление пользователю
      } else if (paymentStatus === "pending") {
        // Ждём действия пользователя - промежуточный статус
        console.log(`⏳ Payment ${payment.paymentId} still pending`);
        // Не меняем статус - просто логируем
      } else {
        console.warn(
          `Unknown payment status: ${paymentStatus} for payment ${payment.paymentId}`,
        );
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      await paymentRepository.logWebhook({
        source,
        eventType,
        payload: JSON.stringify(webhookPayload),
        error: String(error),
      });
      // Не выбрасываем ошибку - Yookassa считает успехом любой HTTP 200
      // но логируем для отладки
    }
  }

  /**
   * Получить статус платежа в Yookassa
   *
   * https://yookassa.ru/developers/api#get-payment
   *
   * Используется для проверки текущего статуса платежа
   * (вместо wait for webhook или как fallback)
   */
  async checkPaymentStatus(
    paymentId: number,
  ): Promise<KassaPaymentResponse | null> {
    try {
      const payment = await paymentRepository.findPaymentById(paymentId);

      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      if (!payment.kassaPaymentId || !kassaClient.isReady()) {
        return null;
      }

      // Запросить актуальный статус из Yookassa
      const kassaPayment = await kassaClient.getPaymentStatus(
        payment.kassaPaymentId,
      );

      // Обновить в нашей БД при необходимости
      if (kassaPayment.status !== payment.status) {
        console.log(
          `Payment status changed: ${payment.status} -> ${kassaPayment.status}`,
        );

        // Обработать изменение статуса
        if (
          kassaPayment.status === "succeeded" &&
          payment.status !== "succeeded"
        ) {
          await paymentRepository.updatePaymentStatus(payment.paymentId, {
            status: "succeeded",
            kassaPaymentId: payment.kassaPaymentId,
          });

          await paymentRepository.updateReservationStatus(
            payment.reservationId,
            "paid",
          );
        }
      }

      return kassaPayment;
    } catch (error) {
      console.error(`Failed to check payment status:`, error);
      return null;
    }
  }

  /**
   * Рассчитать доступную сумму возврата
   *
   * Согласно документации Yookassa:
   * - Возврат возможен в течение 3 лет
   * - Комиссия Yookassa не возвращается
   * - Можно вернуть полностью или частично
   */
  async calculateRefund(reservationId: number): Promise<{
    originalAmount: number;
    expenses: any[];
    totalExpenses: number;
    platformFee: number;
    refundAmount: number;
  }> {
    try {
      // 1. Найти платёж
      const reservation = await prisma.reservation.findUnique({
        where: { reservationId },
        include: { payment: true },
      });

      if (!reservation?.payment) {
        throw new Error(`No payment found for reservation ${reservationId}`);
      }

      const originalAmount = reservation.payment.amount.toNumber();

      // 2. Получить все расходы по отмене
      const expenses =
        await paymentRepository.getCancellationExpenses(reservationId);

      // 3. Сумма невозвратимых расходов
      const totalNonRefundableExpenses = expenses
        .filter((e) => !e.description?.includes("refundable"))
        .reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

      // 4. Комиссия платёжной системы (обычно 1-2%, не возвращается)
      // Yookassa takes ~2% commission
      const platformFee = originalAmount * 0.015; // 1.5% default

      // 5. Итоговая сумма возврата
      const refundAmount = Math.max(
        0,
        originalAmount - totalNonRefundableExpenses - platformFee,
      );

      return {
        originalAmount,
        expenses,
        totalExpenses: totalNonRefundableExpenses,
        platformFee,
        refundAmount,
      };
    } catch (error) {
      console.error(
        `Failed to calculate refund for reservation ${reservationId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Инициировать возврат платежа
   *
   * https://yookassa.ru/developers/api#create-refund
   *
   * - Полный возврат: без параметра amount
   * - Частичный возврат: с параметром amount (в копейках)
   * - Статусы: pending, succeeded, canceled
   */
  async refundPayment(
    paymentId: number,
    amount?: number,
    reason?: string,
  ): Promise<any> {
    try {
      // 1. Найти платёж
      const payment = await paymentRepository.findPaymentById(paymentId);
      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      if (payment.status !== "succeeded") {
        throw new Error(
          `Cannot refund payment with status "${payment.status}". Only "succeeded" payments can be refunded.`,
        );
      }

      // 2. Рассчитать доступную сумму возврата
      const calculation = await this.calculateRefund(payment.reservationId);

      // 3. Валидировать сумму возврата
      if (amount && amount > calculation.refundAmount) {
        throw new Error(
          `Requested refund ${amount} exceeds available ${calculation.refundAmount}. ` +
            `Original: ${calculation.originalAmount}, Expenses: ${calculation.totalExpenses}, ` +
            `Fee: ${calculation.platformFee}`,
        );
      }

      const refundAmount = amount || calculation.refundAmount;

      // 4. Создать запись о возврате в БД
      const refund = await paymentRepository.createRefund({
        paymentId,
        reservationId: payment.reservationId,
        originalAmount: payment.amount,
        totalExpenses: new Prisma.Decimal(calculation.totalExpenses),
        refundAmount: new Prisma.Decimal(refundAmount),
        reason,
        cancellationReasonCode: "CUSTOMER_REQUEST",
        expenseDocumentation: JSON.stringify(calculation.expenses),
      });

      // 5. Отправить запрос в Yookassa (если готова)
      if (!kassaClient.isReady() || !payment.kassaPaymentId) {
        console.warn(
          `Yookassa not ready or payment has no kassaPaymentId. ` +
            `Refund created locally with ID ${refund.refundId}`,
        );
        return refund;
      }

      try {
        const refundIdempotencyKey = kassaClient.generateIdempotencyKey();
        const kassaRefund = await kassaClient.createRefund(
          payment.kassaPaymentId,
          refundIdempotencyKey,
          Math.round(refundAmount * 100), // копейки
          reason,
        );

        // 6. Обновить возврат с данными от Yookassa
        await paymentRepository.updateRefundStatus(refund.refundId, {
          status: "PENDING", // Начальный статус после создания
          kassaRefundId: kassaRefund.id,
        });

        console.log(
          `Refund ${refund.refundId} created in Yookassa with ID ${kassaRefund.id}`,
        );

        return refund;
      } catch (kassaError) {
        console.error(
          `Failed to create refund in Yookassa for payment ${payment.paymentId}:`,
          kassaError,
        );

        // Возврат создан в нашей БД, но Yookassa вернула ошибку
        // Статус останется pending, можно retry позже
        throw kassaError;
      }
    } catch (error) {
      console.error(`Failed to refund payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Обработать вебхук о статусе возврата от Yookassa
   *
   * https://yookassa.ru/developers/api#refund-object
   *
   * Статусы возврата: pending, succeeded, canceled
   */
  async handleRefundWebhook(webhookPayload: any): Promise<void> {
    try {
      const refundId = webhookPayload.object?.id;
      if (!refundId) {
        throw new Error("Refund ID not found in webhook");
      }

      const refundStatus = webhookPayload.object?.status;
      if (!refundStatus) {
        throw new Error("Refund status not found in webhook");
      }

      // Найти возврат в БД
      const refund = await paymentRepository.findRefundByKassaId(refundId);

      if (!refund) {
        console.warn(`Refund ${refundId} not found in database`);
        return;
      }

      if (refundStatus === "succeeded") {
        console.log(`✓ Refund ${refundId} succeeded`);
        
        await paymentRepository.updateRefundStatus(refund.refundId, {
          status: "COMPLETED",
          completedAt: new Date(),
        });

        // После успешного возврата средств отменяем бронирование
        await paymentRepository.updateReservationStatus(
          refund.reservationId,
          "cancelled",
          "Reservation cancelled due to payment refund"
        );

      } else if (refundStatus === "canceled") {
        console.log(`✗ Refund ${refundId} canceled`);
        
        await paymentRepository.updateRefundStatus(refund.refundId, {
          status: "CANCELLED",
        });
      } else if (refundStatus === "pending") {
        console.log(`⏳ Refund ${refundId} still pending`);
      }
    } catch (error) {
      console.error("Refund webhook processing error:", error);
    }
  }

  /**
   * Отменить бронирования с истёкшим сроком оплаты
   */
  async cancelExpiredReservations(): Promise<void> {
    try {
      const expiredReservations =
        await paymentRepository.getExpiredPaymentReservations();

      for (const reservation of expiredReservations) {
        try {
          console.log(
            `Cancelling expired reservation ${reservation.reservationId}`,
          );

          // Обновить статус бронирования
          await prisma.reservation.update({
            where: { reservationId: reservation.reservationId },
            data: {
              status: "cancelled",
              cancellationReason: "Payment deadline expired (15 minutes)",
            },
          });

          // Yookassa автоматически отменяет pending платежи через некоторое время
          // Мы можем явно отменить платёж если он в статусе waiting_for_capture
          if (reservation.payment?.kassaPaymentId && kassaClient.isReady()) {
            try {
              const cancelIdempotencyKey = kassaClient.generateIdempotencyKey();
              await kassaClient.cancelPayment(
                reservation.payment.kassaPaymentId,
                cancelIdempotencyKey,
              );
              console.log(
                `Cancelled payment ${reservation.payment.paymentId} in Yookassa`,
              );
            } catch (error) {
              console.warn(
                `Failed to cancel payment in Yookassa (may already be expired):`,
                error,
              );
            }
          }

          console.log(
            `Reservation ${reservation.reservationId} cancelled due to payment timeout`,
          );
        } catch (error) {
          console.error(
            `Failed to cancel reservation ${reservation.reservationId}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error("Failed to cancel expired reservations:", error);
    }
  }

  /**
   * Получить статус платежа
   */
  async getPaymentStatus(paymentId: number) {
    try {
      const payment = await paymentRepository.findPaymentById(paymentId);
      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      return {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount.toString(),
        kassaPaymentId: payment.kassaPaymentId,
        reservation: {
          reservationId: payment.reservation.reservationId,
          status: payment.reservation.status,
          cancellationReason: payment.reservation.cancellationReason,
        },
      };
    } catch (error) {
      console.error(`Failed to get payment status for ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Сгенерировать ключ идемпотентности (используем встроенный в клиент)
   */
  private generateIdempotencyKey(): string {
    return kassaClient.generateIdempotencyKey();
  }
}

export const paymentService = new PaymentService();
