import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { paymentService } from "./payment.service";
import {
  createPaymentSchema,
  createRefundSchema,
  webhookPayloadSchema,
} from "./payment.validation";

export const paymentController = {
  createPayment: asyncHandler(async (req: Request, res: Response) => {
    const payload = createPaymentSchema.parse(req.body);
    const result = await paymentService.createPayment(payload.reservationId);

    res.status(201).json({
      success: true,
      data: result,
    });
  }),

  getPayment: asyncHandler(async (req: Request, res: Response) => {
    const paymentId = parseIdParam(String(req.params.paymentId), "payment");
    const payment = await paymentService.getPayment(paymentId);

    res.json({
      success: true,
      data: payment,
    });
  }),

  refreshPayment: asyncHandler(async (req: Request, res: Response) => {
    const paymentId = parseIdParam(String(req.params.paymentId), "payment");
    await paymentService.refreshPaymentStatus(paymentId);
    const payment = await paymentService.getPayment(paymentId);

    res.json({
      success: true,
      data: payment,
    });
  }),

  getReceiptPdf: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const receiptId = String(req.params.receiptId);
    const { buffer, filename } = await paymentService.getReceiptPdf(
      receiptId,
      req.user.userId,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename.replace(/"/g, "")}"`,
    );
    res.send(buffer);
  }),

  createRefund: asyncHandler(async (req: Request, res: Response) => {
    const payload = createRefundSchema.parse(req.body);
    const refund = await paymentService.createRefund(
      payload.paymentId,
      payload.reason,
    );

    res.status(201).json({
      success: true,
      data: {
        refundId: refund.refundId,
        paymentId: refund.paymentId,
        status: refund.status,
        amount: refund.refundAmount.toString(),
        kassaRefundId: refund.kassaRefundId,
      },
    });
  }),

  getRefund: asyncHandler(async (req: Request, res: Response) => {
    const refundId = parseIdParam(String(req.params.refundId), "refund");
    const refund = await paymentService.getRefund(refundId);

    res.json({
      success: true,
      data: refund,
    });
  }),

  paymentWebhook: asyncHandler(async (req: Request, res: Response) => {
    const payload = webhookPayloadSchema.parse(req.body);

    if (payload.event.startsWith("payment.")) {
      await paymentService.handlePaymentWebhook(payload);
    }

    res.json({ success: true });
  }),

  refundWebhook: asyncHandler(async (req: Request, res: Response) => {
    const payload = webhookPayloadSchema.parse(req.body);

    if (payload.event.startsWith("refund.")) {
      await paymentService.handleRefundWebhook(payload);
    }

    res.json({ success: true });
  }),

  yookassaWebhook: asyncHandler(async (req: Request, res: Response) => {
    const payload = webhookPayloadSchema.parse(req.body);

    if (payload.event.startsWith("payment.")) {
      await paymentService.handlePaymentWebhook(payload);
    }

    if (payload.event.startsWith("refund.")) {
      await paymentService.handleRefundWebhook(payload);
    }

    res.json({ success: true });
  }),
};
