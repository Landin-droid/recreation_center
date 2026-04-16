import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export const invoiceInclude = {
  reservation: {
    include: {
      customer: true,
      bookableObject: true,
    },
  },
  payment: true,
} satisfies Prisma.InvoiceInclude;

export const paymentInclude = {
  invoice: {
    include: {
      reservation: {
        include: {
          customer: true,
          bookableObject: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

export type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

export const billingRepository = {
  findInvoices: () =>
    prisma.invoice.findMany({
      include: invoiceInclude,
      orderBy: [{ issueDate: "desc" }, { invoiceId: "desc" }],
    }),

  findInvoiceById: (invoiceId: number) =>
    prisma.invoice.findUnique({
      where: { invoiceId },
      include: invoiceInclude,
    }),

  findInvoiceBaseById: (invoiceId: number) =>
    prisma.invoice.findUnique({
      where: { invoiceId },
    }),

  createInvoice: (data: Prisma.InvoiceCreateInput) =>
    prisma.invoice.create({
      data,
      include: invoiceInclude,
    }),

  updateInvoice: (invoiceId: number, data: Prisma.InvoiceUpdateInput) =>
    prisma.invoice.update({
      where: { invoiceId },
      data,
      include: invoiceInclude,
    }),

  deleteInvoice: (invoiceId: number) =>
    prisma.invoice.delete({
      where: { invoiceId },
    }),

  findReservationById: (reservationId: number) =>
    prisma.reservation.findUnique({
      where: { reservationId },
    }),

  findPayments: () =>
    prisma.payment.findMany({
      include: paymentInclude,
      orderBy: [{ paymentDate: "desc" }, { paymentId: "desc" }],
    }),

  findPaymentById: (paymentId: number) =>
    prisma.payment.findUnique({
      where: { paymentId },
      include: paymentInclude,
    }),

  findPaymentBaseById: (paymentId: number) =>
    prisma.payment.findUnique({
      where: { paymentId },
      include: {
        invoice: true,
      },
    }),

  createPayment: (data: Prisma.PaymentCreateInput) =>
    prisma.payment.create({
      data,
      include: paymentInclude,
    }),

  updatePayment: (paymentId: number, data: Prisma.PaymentUpdateInput) =>
    prisma.payment.update({
      where: { paymentId },
      data,
      include: paymentInclude,
    }),

  deletePayment: (paymentId: number) =>
    prisma.payment.delete({
      where: { paymentId },
    }),
};
