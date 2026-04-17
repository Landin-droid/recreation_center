import { Router } from "express";
import { paymentController } from "./payment.controller";
import { authenticate } from "../../middleware/auth";

export const paymentRouter = Router();

/**
 * Публичные routes (без аутентификации)
 */

// Вебхук от ЮKassa (НИКОГДА не защищать authenticate!)
paymentRouter.post("/webhook", paymentController.webhook);

/**
 * Защищённые routes (требуют аутентификации)
 */

// Инициировать платёж
paymentRouter.post("/initiate", authenticate, paymentController.initiate);

// Получить статус платежа
paymentRouter.get(
  "/:paymentId/status",
  authenticate,
  paymentController.getStatus,
);

// Запросить возврат
paymentRouter.post(
  "/:paymentId/refund",
  authenticate,
  paymentController.refund,
);

export default paymentRouter;
