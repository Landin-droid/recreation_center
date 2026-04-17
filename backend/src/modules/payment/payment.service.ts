import { paymentRepository } from "./payment.repository";
import { kassaClient } from "./payment.kassa";
import { env } from "../../config/env";
import prisma from "../../lib/prisma";
import dayjs from "dayjs";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

class PaymentService {
  /**
   * Инициировать платёж (создать invoice и отправить в ЮKassa)
   * Возвращает URL для редиректа
   */
  async initiatePayment(reservationId: number): Promise<{
    paymentId: number;
    confirmationUrl: string;
    paymentDeadline: Date;
  }> {
    // 1. Найти бронирование
    const reservation = await prisma.reservation.findUnique({
      where: { reservationId },
      include: {
        invoice: true,
        user: true,
        bookableObject: true,
      },
    });

    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    if (!reservation.invoice) {
      throw new Error(`Invoice for reservation ${reservationId} not found`);
    }

    // 2. Генерировать ключ идемпотентности
    const idempotencyKey = this.generateIdempotencyKey(
      reservationId,
      reservation.invoice.invoiceId,
    );

    // 3. Проверить, не создан ли уже платёж с этим ключом (idempotence)
    const existingPayment =
      await paymentRepository.findPaymentByIdempotencyKey(idempotencyKey);
    if (existingPayment && existingPayment.status !== "failed") {
      return {
        paymentId: existingPayment.paymentId,
        confirmationUrl: this.generateConfirmationUrl(existingPayment),
        paymentDeadline: existingPayment.reservation.paymentDeadline!,
      };
    }

    // 4. Создать запись платежа в БД (статус: pending)
    const payment = await paymentRepository.createPayment({
      invoiceId: reservation.invoice.invoiceId,
      reservationId,
      amount: new Prisma.Decimal(reservation.totalSum.toString()),
      idempotencyKey,
    });

    // 5. Установить deadline платежа (текущее время + 15 минут)
    const paymentDeadline = dayjs()
      .add(env.PAYMENT_TIMEOUT_MINUTES, "minute")
      .toDate();

    await prisma.reservation.update({
      where: { reservationId },
      data: {
        paymentDeadline,
      },
    });

    // 6. Отправить запрос в ЮKassa (если клиент готов)
    if (!kassaClient.isReady()) {
      console.warn("ЮKassa не настроена - режим тестирования");
      return {
        paymentId: payment.paymentId,
        confirmationUrl: `${env.PAYMENT_SUCCESS_REDIRECT}?paymentId=${payment.paymentId}`,
        paymentDeadline,
      };
    }

    try {
      const kassaRequest = {
        amount: Math.round(reservation.totalSum.toNumber() * 100), // в копейках
        currency: "RUB",
        description: `Бронирование ${reservation.bookableObject.name} на ${dayjs(reservation.reservationDate).format("DD.MM.YYYY")}`,
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: env.PAYMENT_SUCCESS_REDIRECT,
        },
        metadata: {
          reservationId: String(reservationId),
          invoiceId: String(reservation.invoice.invoiceId),
          idempotencyKey,
        },
      };

      const kassaResponse = await kassaClient.createPayment(
        kassaRequest,
        idempotencyKey,
      );

      // 7. Обновить платёж с ID от ЮKassa
      await paymentRepository.updatePaymentStatus(payment.paymentId, {
        status: "pending",
        kassaPaymentId: kassaResponse.id,
      });

      const confirmationUrl =
        kassaResponse.confirmation?.confirmation_url ||
        `${env.PAYMENT_SUCCESS_REDIRECT}?paymentId=${payment.paymentId}`;

      return {
        paymentId: payment.paymentId,
        confirmationUrl,
        paymentDeadline,
      };
    } catch (error) {
      console.error("ЮKassa API error:", error);
      // Даже если ЮKassa не ответила, возвращаем платёж
      // (он будет обработан при webhook'е позже)
      throw new Error(`Failed to create payment in ЮKassa: ${error}`);
    }
  }

  /**
   * Обработать вебхук от ЮKassa
   * Обновить статус платежа и бронирования
   */
  async handleWebhook(webhookPayload: any): Promise<void> {
    const source = "yookassa";
    const eventType = webhookPayload.type || webhookPayload.event;

    try {
      // 1. Логировать вебхук
      await paymentRepository.logWebhook({
        source,
        eventType,
        payload: JSON.stringify(webhookPayload),
      });

      // 2. Извлечь данные
      const kassaPaymentId = webhookPayload.object?.id;
      if (!kassaPaymentId) {
        throw new Error("Payment ID not found in webhook");
      }

      // 3. Проверить idempotence - не обработали ли уже этот платёж
      const existingWebhooks = await paymentRepository.findWebhooksByPayload(
        source,
        eventType,
        kassaPaymentId,
      );
      if (existingWebhooks.length > 1) {
        console.warn(`Webhook for payment ${kassaPaymentId} already processed`);
        return;
      }

      // 4. Найти платёж в нашей БД
      const payment =
        await paymentRepository.findPaymentByKassaId(kassaPaymentId);
      if (!payment) {
        throw new Error(`Payment ${kassaPaymentId} not found in DB`);
      }

      // 5. Обновить статус в зависимости от события
      const paymentStatus = webhookPayload.object?.status;

      if (paymentStatus === "succeeded") {
        // Платёж успешен
        await paymentRepository.updatePaymentStatus(payment.paymentId, {
          status: "succeeded",
          transactionId: kassaPaymentId,
        });

        // Обновить статус бронирования
        await paymentRepository.updateReservationPaymentStatus(
          payment.reservationId,
          "PAID",
        );

        // Обновить счёт как оплаченный
        await prisma.invoice.update({
          where: { invoiceId: payment.invoiceId },
          data: {
            dueDate: new Date(),
          },
        });

        console.log(
          `Payment ${payment.paymentId} succeeded for reservation ${payment.reservationId}`,
        );
      } else if (paymentStatus === "canceled" || paymentStatus === "failed") {
        // Платёж отменён или неудачен
        await paymentRepository.updatePaymentStatus(payment.paymentId, {
          status: paymentStatus === "canceled" ? "cancelled" : "failed",
        });

        // Обновить статус бронирования
        await paymentRepository.updateReservationPaymentStatus(
          payment.reservationId,
          "FAILED",
        );

        console.log(
          `Payment ${payment.paymentId} ${paymentStatus} for reservation ${payment.reservationId}`,
        );
      } else if (paymentStatus === "pending") {
        // Платёж ещё в процессе
        console.log(
          `Payment ${payment.paymentId} is still pending for reservation ${payment.reservationId}`,
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
      throw error;
    }
  }

  /**
   * Рассчитать размер возврата (с учётом документированных расходов)
   */
  async calculateRefund(reservationId: number): Promise<{
    originalAmount: number;
    expenses: any[];
    totalExpenses: number;
    platformFee: number;
    refundAmount: number;
  }> {
    // 1. Найти платёж
    const reservation = await prisma.reservation.findUnique({
      where: { reservationId },
      include: {
        payment: true,
      },
    });

    if (!reservation || !reservation.payment) {
      throw new Error(`Payment for reservation ${reservationId} not found`);
    }

    const originalAmount = reservation.payment.amount.toNumber();

    // 2. Получить все расходы
    const expenses =
      await paymentRepository.getCancellationExpenses(reservationId);

    // 3. Сумма расходов (только не возвратимые)
    const totalNonRefundableExpenses = expenses
      .filter((e) => !e.description?.includes("refundable"))
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // 4. Комиссия платёжной системы (1.5%)
    const platformFee = originalAmount * 0.015;

    // 5. Итоговый возврат
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
  }

  /**
   * Инициировать возврат (полный или частичный)
   */
  async refundPayment(paymentId: number, amount?: number, reason?: string) {
    // 1. Найти платёж
    const payment = await paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // 2. Рассчитать возврат
    const calculation = await this.calculateRefund(payment.reservationId);

    // 3. Валидировать сумму возврата
    if (amount && amount > calculation.refundAmount) {
      throw new Error(
        `Refund amount ${amount} exceeds available ${calculation.refundAmount}`,
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

    // 5. Если ЮKassa готова - отправить запрос на возврат
    if (!kassaClient.isReady() || !payment.kassaPaymentId) {
      console.warn("ЮKassa не готова или платёж не имеет kassaPaymentId");
      return refund;
    }

    try {
      const kassaRefundResponse = await kassaClient.createRefund(
        payment.kassaPaymentId,
        Math.round(refundAmount * 100), // в копейках
      );

      // 6. Обновить возврат с ID от ЮKassa
      await paymentRepository.updateRefundStatus(refund.refundId, {
        status: "IN_PROGRESS",
        kassaRefundId: kassaRefundResponse.id,
      });

      return refund;
    } catch (error) {
      console.error("ЮKassa refund error:", error);
      throw new Error(`Failed to create refund in ЮKassa: ${error}`);
    }
  }

  /**
   * Отменить бронирование с истёкшим сроком оплаты
   */
  async cancelExpiredReservations(): Promise<void> {
    const expiredReservations =
      await paymentRepository.getExpiredPaymentReservations();

    for (const reservation of expiredReservations) {
      try {
        console.log(
          `Cancelling expired reservation ${reservation.reservationId}`,
        );

        // 1. Обновить статус бронирования
        await prisma.reservation.update({
          where: { reservationId: reservation.reservationId },
          data: {
            status: "cancelled",
            paymentStatus: "CANCELLED",
          },
        });

        // 2. Отменить платёж в ЮKassa (если была попытка оплаты)
        if (reservation.payment?.kassaPaymentId && kassaClient.isReady()) {
          try {
            // ЮKassa автоматически отменяет платежи через определённое время
            console.log(
              `Payment ${reservation.payment.paymentId} will be cancelled by ЮKassa timeout`,
            );
          } catch (error) {
            console.error("Failed to cancel payment in ЮKassa:", error);
          }
        }

        // 3. Отправить уведомление пользователю (можно через email)
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
  }

  /**
   * Получить статус платежа
   */
  async getPaymentStatus(paymentId: number) {
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
        paymentStatus: payment.reservation.paymentStatus,
      },
    };
  }

  /**
   * Сгенерировать уникальный ключ идемпотентности
   */
  private generateIdempotencyKey(
    reservationId: number,
    invoiceId: number,
  ): string {
    const timestamp = Date.now();
    const data = `${reservationId}-${invoiceId}-${timestamp}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Генерировать URL подтверждения (для тестирования без ЮKassa)
   */
  private generateConfirmationUrl(payment: any): string {
    if (payment.kassaPaymentId) {
      return `https://yookassa.ru/payments/${payment.kassaPaymentId}`;
    }
    return `${env.PAYMENT_SUCCESS_REDIRECT}?paymentId=${payment.paymentId}`;
  }
}

export const paymentService = new PaymentService();
