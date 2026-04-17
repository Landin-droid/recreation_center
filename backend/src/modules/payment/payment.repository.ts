import prisma from "../../lib/prisma";
import { PaymentStatus, RefundStatus, Prisma } from "@prisma/client";
import {
  PaymentResponse,
  CancellationExpenseRecord,
  RefundResponse,
} from "./payment.types";

class PaymentRepository {
  /**
   * Найти платёж по ключу идемпотентности (защита от дублирования)
   */
  async findPaymentByIdempotencyKey(key: string) {
    return prisma.payment.findUnique({
      where: { idempotencyKey: key },
      include: {
        invoice: true,
        reservation: true,
      },
    });
  }

  /**
   * Найти платёж по ID ЮKassa
   */
  async findPaymentByKassaId(kassaPaymentId: string) {
    return prisma.payment.findUnique({
      where: { kassaPaymentId },
      include: {
        invoice: true,
        reservation: true,
      },
    });
  }

  /**
   * Найти платёж по ID
   */
  async findPaymentById(paymentId: number) {
    return prisma.payment.findUnique({
      where: { paymentId },
      include: {
        invoice: {
          include: {
            reservation: {
              include: {
                user: true,
                bookableObject: true,
              },
            },
          },
        },
        reservation: true,
      },
    });
  }

  /**
   * Создать запись платежа в БД
   */
  async createPayment(data: {
    invoiceId: number;
    reservationId: number;
    amount: Prisma.Decimal;
    idempotencyKey: string;
    status?: PaymentStatus;
    method?: string;
  }) {
    return prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        reservationId: data.reservationId,
        amount: data.amount,
        idempotencyKey: data.idempotencyKey,
        status: data.status || "pending",
        method: (data.method as any) || undefined,
      },
      include: {
        invoice: true,
        reservation: true,
      },
    });
  }

  /**
   * Обновить статус платежа (при вебхуке от ЮKassa)
   */
  async updatePaymentStatus(
    paymentId: number,
    data: {
      status: PaymentStatus;
      kassaPaymentId?: string;
      transactionId?: string;
    },
  ) {
    return prisma.payment.update({
      where: { paymentId },
      data: {
        status: data.status,
        ...(data.kassaPaymentId && { kassaPaymentId: data.kassaPaymentId }),
        ...(data.transactionId && { transactionId: data.transactionId }),
      },
      include: {
        invoice: true,
        reservation: true,
      },
    });
  }

  /**
   * Получить все расходы по бронированию
   */
  async getCancellationExpenses(
    reservationId: number,
  ): Promise<CancellationExpenseRecord[]> {
    const expenses = await prisma.cancellationExpense.findMany({
      where: { reservationId },
    });

    return expenses.map((e: (typeof expenses)[number]) => ({
      expenseId: e.expenseId,
      expenseType: e.expenseType,
      amount: e.amount.toString(),
      description: e.description,
      receiptUrl: e.receiptUrl,
      supplierName: e.supplierName,
    }));
  }

  /**
   * Создать запись о расходе
   */
  async createCancellationExpense(data: {
    reservationId: number;
    expenseType: string;
    amount: Prisma.Decimal;
    description?: string;
    receiptUrl?: string;
    supplierName?: string;
    isRefundable?: boolean;
  }) {
    return prisma.cancellationExpense.create({
      data: {
        reservationId: data.reservationId,
        expenseType: data.expenseType as any,
        amount: data.amount,
        description: data.description,
        receiptUrl: data.receiptUrl,
        supplierName: data.supplierName,
        isRefundable: data.isRefundable || false,
      },
    });
  }

  /**
   * Создать запись о возврате
   */
  async createRefund(data: {
    paymentId: number;
    reservationId: number;
    originalAmount: Prisma.Decimal;
    totalExpenses: Prisma.Decimal;
    refundAmount: Prisma.Decimal;
    reason?: string;
    cancellationReasonCode: string;
    expenseDocumentation?: string;
  }) {
    return prisma.refund.create({
      data: {
        paymentId: data.paymentId,
        reservationId: data.reservationId,
        originalAmount: data.originalAmount,
        totalExpenses: data.totalExpenses,
        refundAmount: data.refundAmount,
        reason: data.reason,
        cancellationInitiatedBy: data.cancellationReasonCode as any,
        cancellationReasonCode: data.cancellationReasonCode as any,
        expenseDocumentation: data.expenseDocumentation,
        status: "PENDING",
      },
      include: {
        payment: true,
        reservation: true,
      },
    });
  }

  /**
   * Обновить статус возврата
   */
  async updateRefundStatus(
    refundId: number,
    data: {
      status: RefundStatus;
      kassaRefundId?: string;
      completedAt?: Date;
    },
  ) {
    return prisma.refund.update({
      where: { refundId },
      data: {
        status: data.status,
        ...(data.kassaRefundId && { kassaRefundId: data.kassaRefundId }),
        ...(data.completedAt && { completedAt: data.completedAt }),
      },
      include: {
        payment: true,
        reservation: true,
      },
    });
  }

  /**
   * Найти возврат по ID
   */
  async getRefundById(refundId: number) {
    return prisma.refund.findUnique({
      where: { refundId },
      include: {
        payment: true,
        reservation: true,
      },
    });
  }

  /**
   * Логировать вебхук (для отладки и idempotence)
   */
  async logWebhook(data: {
    source: string;
    eventType: string;
    payload: string;
    error?: string;
  }) {
    return prisma.webhookLog.create({
      data: {
        source: data.source,
        eventType: data.eventType as any,
        payload: data.payload,
        error: data.error,
        processed: !data.error,
      },
    });
  }

  /**
   * Найти вебхуки с конкретным payload (для идемпотентности)
   */
  async findWebhooksByPayload(
    source: string,
    eventType: string,
    paymentId: string,
  ) {
    return prisma.webhookLog.findMany({
      where: {
        source,
        eventType: eventType as any,
        payload: {
          contains: paymentId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
  }

  /**
   * Получить платежи с истёкшим сроком оплаты (для автоотмены)
   */
  async getExpiredPaymentReservations() {
    return prisma.reservation.findMany({
      where: {
        paymentDeadline: {
          lt: new Date(),
        },
        paymentStatus: "PENDING_PAYMENT",
      },
      include: {
        invoice: true,
        payment: true,
        user: true,
      },
    });
  }

  /**
   * Обновить статус платежа в бронировании
   */
  async updateReservationPaymentStatus(reservationId: number, status: string) {
    return prisma.reservation.update({
      where: { reservationId },
      data: {
        paymentStatus: status as any,
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
