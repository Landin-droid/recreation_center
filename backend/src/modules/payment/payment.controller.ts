import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { paymentService } from "./payment.service";
import { kassaClient } from "./payment.kassa";
import {
  initiatePaymentSchema,
  refundPaymentSchema,
  webhookPayloadSchema,
  paymentStatusQuerySchema,
} from "./payment.validation";

export const paymentController = {
  /**
   * Инициировать платёж - создать invoice и получить URL редиректа
   * POST /payment/initiate
   */
  initiate: asyncHandler(async (req: Request, res: Response) => {
    const payload = initiatePaymentSchema.parse(req.body);

    const result = await paymentService.initiatePayment(payload.reservationId);

    res.status(201).json({
      success: true,
      data: {
        paymentId: result.paymentId,
        confirmationUrl: result.confirmationUrl,
        paymentDeadline: result.paymentDeadline,
      },
    });
  }),

  /**
   * Получить статус платежа
   * GET /payment/:paymentId/status
   */
  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const paymentId = parseIdParam(String(req.params.paymentId), "payment");

    const status = await paymentService.getPaymentStatus(paymentId);

    res.json({
      success: true,
      data: status,
    });
  }),

  /**
   * Вебхук от ЮKassa (без аутентификации!)
   * POST /payment/webhook
   */
  webhook: asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;

    // 1. Логировать и парсить
    console.log(
      "Received webhook from ЮKassa:",
      JSON.stringify(payload, null, 2),
    );

    // 2. Валидировать payload
    const validatedPayload = webhookPayloadSchema.parse(payload);

    // 3. Проверить подпись (если настроена)
    const signature = req.headers["x-yookassa-server-request-id"] as string;
    if (
      signature &&
      !kassaClient.verifyWebhookSignature(JSON.stringify(payload), signature)
    ) {
      console.warn("Invalid webhook signature");
      // В production отклонить, в dev - пропустить проверку
      if (process.env.NODE_ENV === "production") {
        return res
          .status(401)
          .json({ success: false, error: "Invalid signature" });
      }
    }

    // 4. Обработать вебхук
    try {
      await paymentService.handleWebhook(validatedPayload);

      // 5. ЮKassa требует ответа 200 OK
      res.json({ success: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      // Всё равно вернуть 200, чтобы ЮKassa не перепосылала
      res.json({ success: true, error: String(error) });
    }
  }),

  /**
   * Запросить возврат платежа
   * POST /payment/:paymentId/refund
   */
  refund: asyncHandler(async (req: Request, res: Response) => {
    const paymentId = parseIdParam(String(req.params.paymentId), "payment");
    const payload = refundPaymentSchema.parse(req.body);

    const refund = await paymentService.refundPayment(
      paymentId,
      payload.amount,
      payload.reason,
    );

    res.status(201).json({
      success: true,
      data: {
        refundId: refund.refundId,
        status: refund.status,
        amount: refund.refundAmount.toString(),
      },
    });
  }),
};
