import dayjs from "dayjs";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import prisma from "../../lib/prisma";
import { emailService } from "../../lib/email";
import { kassaClient } from "./payment.kassa";
import { paymentRepository } from "./payment.repository";
import {
  KassaReceipt,
  KassaStatement,
  ReceiptEmailData,
} from "./payment.types";
import { buildReceiptSummary, generateReceiptPdf } from "./payment.receipt";

const FULL_REFUND_WITHIN_HOURS_TYPES = new Set(["cottage", "gazebo"]);
const ONE_DAY_REFUND_TYPES = new Set([
  "banquet_hall",
  "karaoke_bar",
  "outdoor_venue",
]);

const formatRub = (amount: number) => amount.toFixed(2);

const normalizePhoneForReceipt = (phone: string | null | undefined) =>
  phone ? phone.replace(/[^\d]/g, "") : undefined;

const formatReceiptDate = (date?: string | Date | null) =>
  date ? dayjs(date).format("D MMMM YYYY HH:mm") : "";

const normalizeEventType = (eventType: string) =>
  eventType.replace(/\./g, "_").toLowerCase();

const buildReceiptEmailParams = (
  rawReceipt: any,
  type: "payment" | "refund",
  objectName: string,
  reservationDate: Date,
  amount: number,
  contactEmail: string,
) => {
  const fiscalizationDate = formatReceiptDate(rawReceipt?.registered_at);
  const item = rawReceipt?.items?.[0];
  const total = rawReceipt?.items[0]?.amount?.value;

  return {
    amount: `${amount.toFixed(2)} ₽`,
    receiptType: type,
    receiptTypeLabel: type === "payment" ? "Чек прихода" : "Чек возврата",
    receiptId: rawReceipt?.id || "",
    receiptStatus: rawReceipt?.status || "",
    fiscalizationDate,
    contactEmail,
    yookassaReceiptId: rawReceipt?.id || "",
    fiscalDocumentNumber: rawReceipt?.fiscal_document_number,
    fiscalStorageNumber: rawReceipt?.fiscal_storage_number,
    fiscalAttribute: rawReceipt?.fiscal_attribute,
    fiscalProviderId: rawReceipt?.fiscal_provider_id,
    objectName,
    reservationDate: formatReceiptDate(reservationDate),
    itemDescription: item?.description || objectName,
    itemQuantity: item?.quantity?.toString() || "1",
    itemPrice: `${item?.amount?.value || total} ₽`,
    totalSum: `${total} ₽`,
    vatInfo: "НДС 22/122",
  };
};

class PaymentService {
  private buildReceipt(params: {
    user: { email: string; phoneNumber?: string | null };
    objectName: string;
    reservationDate: Date;
    amount: number;
    descriptionPrefix: string;
  }): KassaReceipt {
    const description =
      `${params.descriptionPrefix} ${params.objectName} ${dayjs(
        params.reservationDate,
      ).format("DD.MM.YYYY")}`.slice(0, 128);

    return {
      customer: {
        email: params.user.email,
        phone: normalizePhoneForReceipt(params.user.phoneNumber),
      },
      items: [
        {
          description,
          amount: {
            value: formatRub(params.amount),
            currency: "RUB",
          },
          vat_code: 12,
          quantity: 1,
          payment_subject: "service",
          payment_mode: "full_payment",
        },
      ],
      internet: true,
    };
  }

  private buildStatements(params: { email: string }): KassaStatement[] {
    return [
      {
        type: "payment_overview",
        delivery_method: {
          type: "email",
          email: params.email,
        },
      },
    ];
  }

  private async syncPaymentReceipt(
    paymentId: number,
    kassaPaymentId?: string | null,
  ) {
    if (!kassaPaymentId || !kassaClient.isReady()) {
      return;
    }

    const receipts = await kassaClient.listReceipts({
      paymentId: kassaPaymentId,
    });
    for (const receipt of receipts.items ?? []) {
      await paymentRepository.upsertReceipt({
        kassaReceiptId: receipt.id,
        type: "payment",
        status: receipt.status,
        paymentId,
        rawPayload: receipt as Prisma.InputJsonValue,
      });
    }
  }

  private async syncRefundReceipt(
    refundId: number,
    kassaRefundId?: string | null,
  ) {
    if (!kassaRefundId || !kassaClient.isReady()) {
      return;
    }

    const receipts = await kassaClient.listReceipts({
      refundId: kassaRefundId,
    });
    for (const receipt of receipts.items ?? []) {
      await paymentRepository.upsertReceipt({
        kassaReceiptId: receipt.id,
        type: "refund",
        status: receipt.status,
        refundId,
        rawPayload: receipt as Prisma.InputJsonValue,
      });
    }
  }

  async syncPaymentReceiptForPayment(paymentId: number) {
    const payment = await paymentRepository.findPaymentById(paymentId);
    if (!payment?.kassaPaymentId || payment.status !== "succeeded") {
      return payment;
    }

    await this.syncPaymentReceipt(payment.paymentId, payment.kassaPaymentId);
    return paymentRepository.findPaymentById(payment.paymentId);
  }

  async syncRefundReceiptForRefund(refundId: number) {
    const refund = await paymentRepository.findRefundById(refundId);
    if (!refund?.kassaRefundId || refund.status !== "succeeded") {
      return refund;
    }

    await this.syncRefundReceipt(refund.refundId, refund.kassaRefundId);
    return paymentRepository.findRefundById(refund.refundId);
  }

  async createPayment(reservationId: number) {
    const reservation = await prisma.reservation.findUnique({
      where: { reservationId },
      include: {
        user: true,
        bookableObject: true,
        payment: true,
      },
    });

    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    if (reservation.status !== "pending") {
      throw new AppError("Only pending reservations can be paid", 400);
    }

    if (reservation.payment) {
      throw new AppError("Payment already exists for this reservation", 409);
    }

    if (reservation.totalSum.toNumber() <= 0) {
      throw new AppError("Payment amount must be greater than zero", 400);
    }

    const idempotencyKey = kassaClient.generateIdempotencyKey();
    const paymentDeadline = dayjs()
      .add(env.PAYMENT_TIMEOUT_MINUTES, "minute")
      .toDate();

    const payment = await paymentRepository.createPayment({
      reservationId,
      amount: new Prisma.Decimal(reservation.totalSum.toString()),
      idempotencyKey,
    });

    await prisma.reservation.update({
      where: { reservationId },
      data: { paymentDeadline },
    });

    if (!kassaClient.isReady()) {
      return {
        paymentId: payment.paymentId,
        confirmationUrl: `${env.PAYMENT_SUCCESS_REDIRECT}?paymentId=${payment.paymentId}`,
        paymentDeadline,
      };
    }

    const amount = reservation.totalSum.toNumber();
    const kassaPayment = await kassaClient.createPayment(
      {
        amount: {
          value: Math.round(amount * 100).toString(),
          currency: "RUB",
        },
        description:
          `Бронирование ${reservation.bookableObject.name} на ${dayjs(
            reservation.reservationDate,
          ).format("DD.MM.YYYY")}`.slice(0, 128),
        capture: true,
        confirmation: {
          type: "redirect",
          locale: "ru_RU",
          return_url: env.PAYMENT_SUCCESS_REDIRECT,
        },
        metadata: {
          reservationId: String(reservationId),
          localPaymentId: String(payment.paymentId),
        },
        receipt: this.buildReceipt({
          user: reservation.user,
          objectName: reservation.bookableObject.name,
          reservationDate: reservation.reservationDate,
          amount,
          descriptionPrefix: "Бронирование",
        }),
        statements: this.buildStatements({
          email: reservation.user.email,
        }),
      },
      idempotencyKey,
    );

    await paymentRepository.updatePaymentStatus(payment.paymentId, {
      status: kassaPayment.status === "canceled" ? "canceled" : "pending",
      kassaPaymentId: kassaPayment.id,
      method: kassaPayment.payment_method?.type,
    });

    await this.syncPaymentReceipt(payment.paymentId, kassaPayment.id).catch(
      (error) => console.warn("Failed to sync payment receipt:", error),
    );

    return {
      paymentId: payment.paymentId,
      confirmationUrl: kassaPayment.confirmation?.confirmation_url,
      paymentDeadline,
    };
  }

  async getPayment(paymentId: number) {
    await this.refreshPaymentStatus(paymentId);
    const payment = await paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    let receiptEmailData: ReceiptEmailData | undefined = undefined;
    if (payment.status === "succeeded" && payment.receipt?.rawPayload) {
      const fullReservation = await prisma.reservation.findUnique({
        where: { reservationId: payment.reservationId },
        include: { user: true, bookableObject: true },
      });
      if (fullReservation) {
        receiptEmailData = {
          to_email: fullReservation.user.email,
          ...buildReceiptEmailParams(
            payment.receipt.rawPayload,
            "payment",
            fullReservation.bookableObject.name,
            fullReservation.reservationDate,
            fullReservation.totalSum.toNumber(),
            fullReservation.user.email,
          ),
        };
      }
    }

    return {
      paymentId: payment.paymentId,
      reservationId: payment.reservationId,
      status: payment.status,
      method: payment.method,
      amount: payment.amount.toString(),
      kassaPaymentId: payment.kassaPaymentId,
      receipt: buildReceiptSummary(payment.receipt),
      receiptEmailData,
      reservation: {
        reservationId: payment.reservation.reservationId,
        status: payment.reservation.status,
      },
    };
  }

  async refreshPaymentStatus(paymentId: number) {
    const payment = await paymentRepository.findPaymentById(paymentId);
    if (!payment?.kassaPaymentId || !kassaClient.isReady()) {
      return null;
    }

    const kassaPayment = await kassaClient.getPaymentStatus(
      payment.kassaPaymentId,
    );
    await this.applyPaymentStatus(kassaPayment.id, kassaPayment);
    return kassaPayment;
  }

  private async applyPaymentStatus(kassaPaymentId: string, payload: any) {
    const payment =
      await paymentRepository.findPaymentByKassaId(kassaPaymentId);
    if (!payment) {
      throw new Error(`Payment ${kassaPaymentId} not found`);
    }

    if (payment.status === "succeeded" || payment.status === "canceled") {
      return payment;
    }

    const method = payload.payment_method?.type;
    const status = payload.status;

    if (status === "succeeded") {
      await paymentRepository.updatePaymentStatus(payment.paymentId, {
        status: "succeeded",
        kassaPaymentId,
        method,
      });
      await paymentRepository.updateReservationStatus(
        payment.reservationId,
        "paid",
      );
      await this.syncPaymentReceipt(payment.paymentId, kassaPaymentId).catch(
        (error) => console.warn("Failed to sync payment receipt:", error),
      );

      const paymentWithReceipt = await paymentRepository.findPaymentById(
        payment.paymentId,
      );

      const fullReservation = await prisma.reservation.findUnique({
        where: { reservationId: payment.reservationId },
        include: { user: true, bookableObject: true },
      });

      if (
        fullReservation?.user.email &&
        paymentWithReceipt?.receipt?.rawPayload
      ) {
        // Email sending moved to frontend
        // const receiptParams = buildReceiptEmailParams(
        //   paymentWithReceipt.receipt.rawPayload,
        //   "payment",
        //   fullReservation.bookableObject.name,
        //   fullReservation.reservationDate,
        //   fullReservation.totalSum.toNumber(),
        //   fullReservation.user.email,
        // );
        // await emailService.sendReceipt(
        //   fullReservation.user.email,
        //   receiptParams,
        // );
      }
    }

    if (status === "canceled") {
      await paymentRepository.updatePaymentStatus(payment.paymentId, {
        status: "canceled",
        kassaPaymentId,
        method,
      });
      await paymentRepository.updateReservationStatus(
        payment.reservationId,
        "canceled",
      );
    }

    return paymentRepository.findPaymentById(payment.paymentId);
  }

  private assertRefundAllowed(
    payment: NonNullable<
      Awaited<ReturnType<typeof paymentRepository.findPaymentById>>
    >,
  ) {
    const reservation = payment.reservation;
    if (payment.status !== "succeeded") {
      throw new AppError("Only succeeded payments can be refunded", 400);
    }

    if (reservation.status !== "paid") {
      throw new AppError("Only paid reservations can be refunded", 400);
    }

    if (payment.refund) {
      throw new AppError("Refund already exists for this payment", 409);
    }

    const now = dayjs();
    const reservationDate = dayjs(reservation.reservationDate);
    const objectType = reservation.bookableObject.type;
    const isGazeboOrCottage = FULL_REFUND_WITHIN_HOURS_TYPES.has(objectType);

    const deadline = isGazeboOrCottage
      ? reservationDate.add(10, "hour")
      : reservationDate.subtract(1, "day").endOf("day");

    if (now.isAfter(deadline)) {
      const rule = isGazeboOrCottage
        ? "Refund is available until reservation date plus 10 hours"
        : "Refund is available no later than the day before reservation date";
      throw new AppError(rule, 400);
    }

    if (!isGazeboOrCottage && !ONE_DAY_REFUND_TYPES.has(objectType)) {
      throw new AppError(
        "Refund policy is not configured for this object type",
        400,
      );
    }
  }

  async createRefund(paymentId: number, reason?: string) {
    const payment = await paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    this.assertRefundAllowed(payment);

    const refund = await paymentRepository.createRefund({
      paymentId,
      originalAmount: new Prisma.Decimal(payment.amount.toString()),
      refundAmount: new Prisma.Decimal(payment.amount.toString()),
      reason,
    });

    if (!kassaClient.isReady() || !payment.kassaPaymentId) {
      return {
        ...refund,
        kassaStatus: refund.status,
      };
    }

    const refundAmount = payment.amount.toNumber();
    const kassaRefund = await kassaClient.createRefund(
      payment.kassaPaymentId,
      kassaClient.generateIdempotencyKey(),
      Math.round(refundAmount * 100),
      reason ?? "Возврат средств за бронирование",
    );

    const updated = await paymentRepository.updateRefundStatus(
      refund.refundId,
      {
        status: kassaRefund.status,
        kassaRefundId: kassaRefund.id,
        completedAt:
          kassaRefund.status === "succeeded" ? new Date() : undefined,
        cancellationParty: kassaRefund.cancellation_details?.party,
        cancellationReason: kassaRefund.cancellation_details?.reason,
      },
    );

    if (kassaRefund.status === "succeeded") {
      await paymentRepository.updateReservationStatus(
        payment.reservationId,
        "refunded",
      );

      await this.syncRefundReceipt(refund.refundId, kassaRefund.id).catch(
        (error) => console.warn("Failed to sync refund receipt:", error),
      );

      const refundWithReceipt = await paymentRepository.findRefundById(
        refund.refundId,
      );

      if (
        payment.reservation.user.email &&
        refundWithReceipt?.receipt?.rawPayload
      ) {
        // Email sending moved to frontend
        // const receiptParams = buildReceiptEmailParams(
        //   refundWithReceipt.receipt.rawPayload,
        //   "refund",
        //   payment.reservation.bookableObject.name,
        //   payment.reservation.reservationDate,
        //   refundAmount,
        //   payment.reservation.user.email,
        // );
        // await emailService.sendReceipt(
        //   payment.reservation.user.email,
        //   receiptParams,
        // );
      }
    }

    return {
      ...updated,
      kassaStatus: kassaRefund.status,
    };
  }

  async getRefund(refundId: number) {
    let refund = await paymentRepository.findRefundById(refundId);
    if (!refund) {
      throw new AppError("Refund not found", 404);
    }

    if (
      refund.status === "succeeded" &&
      !refund.receipt &&
      refund.kassaRefundId
    ) {
      await this.syncRefundReceipt(refund.refundId, refund.kassaRefundId).catch(
        (error) => console.warn("Failed to sync refund receipt:", error),
      );
      refund = await paymentRepository.findRefundById(refundId);
      if (!refund) {
        throw new AppError("Refund not found", 404);
      }
    }

    let receiptEmailData: ReceiptEmailData | undefined = undefined;
    if (refund.status === "succeeded" && refund.receipt?.rawPayload) {
      const payment = await paymentRepository.findPaymentById(refund.paymentId);
      if (payment) {
        const fullReservation = await prisma.reservation.findUnique({
          where: { reservationId: payment.reservationId },
          include: { user: true, bookableObject: true },
        });
        if (fullReservation) {
          receiptEmailData = {
            to_email: fullReservation.user.email,
            ...buildReceiptEmailParams(
              refund.receipt.rawPayload,
              "refund",
              fullReservation.bookableObject.name,
              fullReservation.reservationDate,
              refund.refundAmount.toNumber(),
              fullReservation.user.email,
            ),
          };
        }
      }
    }

    return {
      ...refund,
      receipt: buildReceiptSummary(refund.receipt),
      receiptEmailData,
    };
  }

  async getReceiptPdf(kassaReceiptId: string, userId: number) {
    const receipt = await paymentRepository.findReceiptByKassaId(kassaReceiptId);
    if (!receipt) {
      throw new AppError("Receipt not found", 404);
    }

    const receiptStatus =
      receipt.status ?? ((receipt.rawPayload as any)?.status as string | undefined);
    if (receiptStatus !== "succeeded") {
      throw new AppError("Receipt PDF is available only for succeeded receipts", 400);
    }

    const reservation =
      receipt.payment?.reservation ?? receipt.refund?.payment.reservation;
    if (!reservation) {
      throw new AppError("Receipt reservation not found", 404);
    }

    if (reservation.userId !== userId) {
      throw new AppError("Receipt is not available for this user", 403);
    }

    const summary = buildReceiptSummary(receipt);
    if (!summary) {
      throw new AppError("Receipt data is not available", 404);
    }

    const buffer = await generateReceiptPdf(summary, {
      reservationId: reservation.reservationId,
      objectName: reservation.bookableObject.name,
      reservationDate: reservation.reservationDate,
      customerName: reservation.user.fullName,
      customerEmail: reservation.user.email,
    });

    return {
      buffer,
      filename: `${summary.type}-${summary.receiptId}.pdf`,
    };
  }

  async cancelOrRefundReservation(reservationId: number, reason?: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { reservationId },
      include: {
        payment: true,
      },
    });

    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    if (["canceled", "expired", "refunded"].includes(reservation.status)) {
      throw new AppError("Reservation is already final", 400);
    }

    if (!reservation.payment && reservation.status === "pending") {
      const canceled = await paymentRepository.updateReservationStatus(
        reservationId,
        "canceled",
      );
      return {
        action: "canceled",
        reservation: canceled,
        refund: null,
      };
    }

    if (reservation.payment?.status === "pending") {
      const canceled = await paymentRepository.updateReservationStatus(
        reservationId,
        "canceled",
      );
      return {
        action: "canceled",
        reservation: canceled,
        refund: null,
      };
    }

    if (reservation.payment?.status === "succeeded") {
      const refund = await this.createRefund(
        reservation.payment.paymentId,
        reason,
      );
      return {
        action:
          refund.kassaStatus === "succeeded" ? "refunded" : "refund_started",
        reservation,
        refund,
      };
    }

    throw new AppError("Reservation cannot be canceled in current state", 400);
  }

  async handlePaymentWebhook(webhookPayload: any) {
    await this.logWebhook(webhookPayload);
    const kassaPaymentId = webhookPayload.object?.id;
    if (!kassaPaymentId) {
      throw new Error("Payment ID not found in webhook object");
    }

    await this.applyPaymentStatus(kassaPaymentId, webhookPayload.object);
  }

  async handleRefundWebhook(webhookPayload: any) {
    await this.logWebhook(webhookPayload);
    const kassaRefundId = webhookPayload.object?.id;
    if (!kassaRefundId) {
      throw new Error("Refund ID not found in webhook object");
    }

    const refund = await paymentRepository.findRefundByKassaId(kassaRefundId);
    if (!refund) {
      throw new Error(`Refund ${kassaRefundId} not found`);
    }

    const status = webhookPayload.object.status;
    if (refund.status === "succeeded" || refund.status === "canceled") {
      return;
    }

    await paymentRepository.updateRefundStatus(refund.refundId, {
      status,
      kassaRefundId,
      completedAt: status === "succeeded" ? new Date() : undefined,
      cancellationParty: webhookPayload.object.cancellation_details?.party,
      cancellationReason: webhookPayload.object.cancellation_details?.reason,
    });

    if (status === "succeeded") {
      await paymentRepository.updateReservationStatus(
        refund.payment.reservation.reservationId,
        "refunded",
      );
      await this.syncRefundReceipt(refund.refundId, kassaRefundId).catch(
        (error) => console.warn("Failed to sync refund receipt:", error),
      );
    }
  }

  private async logWebhook(webhookPayload: any) {
    const eventType = normalizeEventType(
      webhookPayload.event || webhookPayload.type,
    );
    const objectId = webhookPayload.object?.id;
    const existing = objectId
      ? await paymentRepository.findWebhooksByPayload(
          "yookassa",
          eventType,
          objectId,
        )
      : [];

    if (existing.length > 0) {
      return;
    }

    await paymentRepository.logWebhook({
      source: "yookassa",
      eventType,
      payload: JSON.stringify(webhookPayload),
    });
  }

  async expireUnpaidReservations() {
    const reservations = await paymentRepository.getExpiredUnpaidReservations();
    for (const reservation of reservations) {
      await paymentRepository.updateReservationStatus(
        reservation.reservationId,
        "expired",
      );
    }
  }

  async cancelExpiredReservations() {
    await this.expireUnpaidReservations();
  }
}

export const paymentService = new PaymentService();
