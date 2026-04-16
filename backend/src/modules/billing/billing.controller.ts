import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { billingService } from "./billing.service";
import {
  invoiceSchema,
  paymentSchema,
  updateInvoiceSchema,
  updatePaymentSchema,
} from "./billing.validation";

export const billingController = {
  listInvoices: asyncHandler(async (_req: Request, res: Response) => {
    const invoices = await billingService.listInvoices();
    res.json({ success: true, data: invoices });
  }),

  getInvoiceById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "invoice");
    const invoice = await billingService.getInvoiceById(id);
    res.json({ success: true, data: invoice });
  }),

  createInvoice: asyncHandler(async (req: Request, res: Response) => {
    const payload = invoiceSchema.parse(req.body);
    const invoice = await billingService.createInvoice(payload);
    res.status(201).json({ success: true, data: invoice });
  }),

  updateInvoice: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "invoice");
    const payload = updateInvoiceSchema.parse(req.body);
    const invoice = await billingService.updateInvoice(id, payload);
    res.json({ success: true, data: invoice });
  }),

  deleteInvoice: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "invoice");
    await billingService.deleteInvoice(id);
    res.status(204).send();
  }),

  listPayments: asyncHandler(async (_req: Request, res: Response) => {
    const payments = await billingService.listPayments();
    res.json({ success: true, data: payments });
  }),

  getPaymentById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "payment");
    const payment = await billingService.getPaymentById(id);
    res.json({ success: true, data: payment });
  }),

  createPayment: asyncHandler(async (req: Request, res: Response) => {
    const payload = paymentSchema.parse(req.body);
    const payment = await billingService.createPayment(payload);
    res.status(201).json({ success: true, data: payment });
  }),

  updatePayment: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "payment");
    const payload = updatePaymentSchema.parse(req.body);
    const payment = await billingService.updatePayment(id, payload);
    res.json({ success: true, data: payment });
  }),

  deletePayment: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "payment");
    await billingService.deletePayment(id);
    res.status(204).send();
  }),
};
