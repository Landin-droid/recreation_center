import { PaymentStatus } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import {
  billingRepository,
  InvoiceWithRelations,
  PaymentWithRelations,
} from "./billing.repository";
import {
  CreateInvoiceInput,
  CreatePaymentInput,
  UpdateInvoiceInput,
  UpdatePaymentInput,
} from "./billing.validation";

const formatInvoice = (invoice: InvoiceWithRelations) => ({
  invoiceId: invoice.invoiceId,
  reservationId: invoice.reservationId,
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  totalAmount: Number(invoice.totalAmount),
  reservation: {
    reservationId: invoice.reservation.reservationId,
    reservationDate: invoice.reservation.reservationDate,
    user: invoice.reservation.user?.fullName || "Unknown",
    bookableObject: invoice.reservation.bookableObject.name,
  },
  payment: invoice.payment
    ? {
        paymentId: invoice.payment.paymentId,
        amount: Number(invoice.payment.amount),
        status: invoice.payment.status,
        method: invoice.payment.method,
      }
    : null,
});

const formatPayment = (payment: PaymentWithRelations) => ({
  paymentId: payment.paymentId,
  invoiceId: payment.invoiceId,
  paymentDate: payment.paymentDate,
  amount: Number(payment.amount),
  transactionId: payment.transactionId,
  status: payment.status,
  method: payment.method,
  chequeUrl: payment.cheque_url,
  invoice: {
    invoiceId: payment.invoice.invoiceId,
    totalAmount: Number(payment.invoice.totalAmount),
    reservationId: payment.invoice.reservation.reservationId,
    user: payment.invoice.reservation.user?.fullName || "Unknown",
  },
});

export const billingService = {
  async listInvoices() {
    const invoices = await billingRepository.findInvoices();
    return invoices.map(formatInvoice);
  },

  async getInvoiceById(invoiceId: number) {
    const invoice = await billingRepository.findInvoiceById(invoiceId);
    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    return formatInvoice(invoice);
  },

  async createInvoice(data: CreateInvoiceInput) {
    const reservation = await billingRepository.findReservationById(
      data.reservationId,
    );
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    const invoice = await billingRepository.createInvoice({
      reservation: {
        connect: { reservationId: data.reservationId },
      },
      dueDate: new Date(data.dueDate),
      totalAmount: data.totalAmount ?? Number(reservation.totalSum),
    });

    return formatInvoice(invoice);
  },

  async updateInvoice(invoiceId: number, data: UpdateInvoiceInput) {
    const existing = await billingRepository.findInvoiceBaseById(invoiceId);
    if (!existing) {
      throw new AppError("Invoice not found", 404);
    }

    if (data.reservationId !== undefined) {
      const reservation = await billingRepository.findReservationById(
        data.reservationId,
      );
      if (!reservation) {
        throw new AppError("Reservation not found", 404);
      }
    }

    const invoice = await billingRepository.updateInvoice(invoiceId, {
      ...(data.reservationId !== undefined
        ? { reservation: { connect: { reservationId: data.reservationId } } }
        : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: new Date(data.dueDate) }
        : {}),
      ...(data.totalAmount !== undefined
        ? { totalAmount: data.totalAmount }
        : {}),
    });

    return formatInvoice(invoice);
  },

  async deleteInvoice(invoiceId: number) {
    const existing = await billingRepository.findInvoiceBaseById(invoiceId);
    if (!existing) {
      throw new AppError("Invoice not found", 404);
    }

    return billingRepository.deleteInvoice(invoiceId);
  },

  async listPayments() {
    const payments = await billingRepository.findPayments();
    return payments.map(formatPayment);
  },

  async getPaymentById(paymentId: number) {
    const payment = await billingRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    return formatPayment(payment);
  },

  async createPayment(data: CreatePaymentInput) {
    const invoice = await billingRepository.findInvoiceBaseById(data.invoiceId);
    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    const amount = data.amount ?? Number(invoice.totalAmount);
    if (amount !== Number(invoice.totalAmount)) {
      throw new AppError(
        "Payment amount must match the invoice total amount",
        400,
      );
    }

    const payment = await billingRepository.createPayment({
      invoice: {
        connect: { invoiceId: data.invoiceId },
      },
      reservation: {
        connect: { reservationId: invoice.reservationId },
      },
      amount,
      transactionId: data.transactionId,
      status: data.status ?? PaymentStatus.pending,
      method: data.method ?? null,
      cheque_url: data.chequeUrl,
      idempotencyKey: `billing-${data.invoiceId}-${Date.now()}`,
    });

    return formatPayment(payment);
  },

  async updatePayment(paymentId: number, data: UpdatePaymentInput) {
    const existing = await billingRepository.findPaymentBaseById(paymentId);
    if (!existing) {
      throw new AppError("Payment not found", 404);
    }

    const nextInvoiceId = data.invoiceId ?? existing.invoiceId;
    const invoice = await billingRepository.findInvoiceBaseById(nextInvoiceId);
    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    const nextAmount = data.amount ?? Number(existing.amount);
    if (nextAmount !== Number(invoice.totalAmount)) {
      throw new AppError(
        "Payment amount must match the related invoice total amount",
        400,
      );
    }

    const payment = await billingRepository.updatePayment(paymentId, {
      ...(data.invoiceId !== undefined
        ? { invoice: { connect: { invoiceId: data.invoiceId } } }
        : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.transactionId !== undefined
        ? { transactionId: data.transactionId }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.method !== undefined ? { method: data.method } : {}),
      ...(data.chequeUrl !== undefined ? { cheque_url: data.chequeUrl } : {}),
    });

    return formatPayment(payment);
  },

  async deletePayment(paymentId: number) {
    const existing = await billingRepository.findPaymentBaseById(paymentId);
    if (!existing) {
      throw new AppError("Payment not found", 404);
    }

    return billingRepository.deletePayment(paymentId);
  },
};
