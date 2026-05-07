import prisma from "../../lib/prisma";
import { PaymentStatus, Prisma, RefundStatus } from "../../generated/prisma/client";

const paymentInclude = {
  reservation: {
    include: {
      user: true,
      bookableObject: true,
    },
  },
  refund: true,
  receipt: true,
} satisfies Prisma.PaymentInclude;

const refundInclude = {
  payment: {
    include: {
      reservation: {
        include: {
          user: true,
          bookableObject: true,
        },
      },
    },
  },
  receipt: true,
} satisfies Prisma.RefundInclude;

class PaymentRepository {
  findPaymentById(paymentId: number) {
    return prisma.payment.findUnique({
      where: { paymentId },
      include: paymentInclude,
    });
  }

  findPaymentByReservationId(reservationId: number) {
    return prisma.payment.findUnique({
      where: { reservationId },
      include: paymentInclude,
    });
  }

  findPaymentByKassaId(kassaPaymentId: string) {
    return prisma.payment.findUnique({
      where: { kassaPaymentId },
      include: paymentInclude,
    });
  }

  createPayment(data: {
    reservationId: number;
    amount: Prisma.Decimal;
    idempotencyKey: string;
  }) {
    return prisma.payment.create({
      data: {
        reservationId: data.reservationId,
        amount: data.amount,
        idempotencyKey: data.idempotencyKey,
        status: "pending",
      },
      include: paymentInclude,
    });
  }

  updatePaymentStatus(
    paymentId: number,
    data: {
      status: PaymentStatus;
      kassaPaymentId?: string;
      method?: string;
    },
  ) {
    return prisma.payment.update({
      where: { paymentId },
      data: {
        status: data.status,
        ...(data.kassaPaymentId ? { kassaPaymentId: data.kassaPaymentId } : {}),
        ...(data.method ? { method: data.method as any } : {}),
      },
      include: paymentInclude,
    });
  }

  createRefund(data: {
    paymentId: number;
    originalAmount: Prisma.Decimal;
    refundAmount: Prisma.Decimal;
    reason?: string;
  }) {
    return prisma.refund.create({
      data: {
        paymentId: data.paymentId,
        originalAmount: data.originalAmount,
        refundAmount: data.refundAmount,
        reason: data.reason,
        status: "pending",
      },
      include: refundInclude,
    });
  }

  findRefundById(refundId: number) {
    return prisma.refund.findUnique({
      where: { refundId },
      include: refundInclude,
    });
  }

  findRefundByPaymentId(paymentId: number) {
    return prisma.refund.findUnique({
      where: { paymentId },
      include: refundInclude,
    });
  }

  findRefundByKassaId(kassaRefundId: string) {
    return prisma.refund.findUnique({
      where: { kassaRefundId },
      include: refundInclude,
    });
  }

  updateRefundStatus(
    refundId: number,
    data: {
      status: RefundStatus;
      kassaRefundId?: string;
      completedAt?: Date | null;
      cancellationParty?: string | null;
      cancellationReason?: string | null;
    },
  ) {
    return prisma.refund.update({
      where: { refundId },
      data: {
        status: data.status,
        ...(data.kassaRefundId ? { kassaRefundId: data.kassaRefundId } : {}),
        ...(data.completedAt ? { completedAt: data.completedAt } : {}),
        ...(data.cancellationParty !== undefined
          ? { cancellationParty: data.cancellationParty }
          : {}),
        ...(data.cancellationReason !== undefined
          ? { cancellationReason: data.cancellationReason }
          : {}),
      },
      include: refundInclude,
    });
  }

  upsertReceipt(data: {
    kassaReceiptId: string;
    type: "payment" | "refund";
    status?: string;
    paymentId?: number;
    refundId?: number;
    rawPayload?: Prisma.InputJsonValue;
  }) {
    return prisma.receipt.upsert({
      where: { kassaReceiptId: data.kassaReceiptId },
      create: {
        kassaReceiptId: data.kassaReceiptId,
        type: data.type,
        status: data.status,
        paymentId: data.paymentId,
        refundId: data.refundId,
        rawPayload: data.rawPayload,
      },
      update: {
        status: data.status,
        paymentId: data.paymentId,
        refundId: data.refundId,
        rawPayload: data.rawPayload,
      },
    });
  }

  logWebhook(data: {
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

  findWebhooksByPayload(source: string, eventType: string, objectId: string) {
    return prisma.webhookLog.findMany({
      where: {
        source,
        eventType: eventType as any,
        payload: {
          contains: objectId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
  }

  getExpiredUnpaidReservations() {
    return prisma.reservation.findMany({
      where: {
        paymentDeadline: {
          lt: new Date(),
        },
        status: "pending",
        payment: null,
      },
      include: {
        user: true,
      },
    });
  }

  updateReservationStatus(reservationId: number, status: string) {
    return prisma.reservation.update({
      where: { reservationId },
      data: {
        status: status as any,
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
