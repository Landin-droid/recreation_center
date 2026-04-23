import { Router } from "express";
import { paymentController } from "./payment.controller";
import { authenticate } from "../../middleware/auth";

export const paymentRouter = Router();

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Вебхук от ЮKassa для обработки платежей
 *     tags:
 *       - Payments
 *     description: Публичный вебхук, защищен подписью от ЮKassa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               object:
 *                 type: object
 *     responses:
 *       200:
 *         description: Вебхук успешно обработан
 */
paymentRouter.post("/webhook", paymentController.webhook);

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Инициировать платеж
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               description:
 *                 type: string
 *                 example: "Оплата бронирования"
 *               reservationId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Платеж инициирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Ошибка валидации
 */
paymentRouter.post("/initiate", authenticate, paymentController.initiate);

/**
 * @swagger
 * /api/payments/{paymentId}/status:
 *   get:
 *     summary: Получить статус платежа
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID платежа
 *     responses:
 *       200:
 *         description: Статус платежа получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
paymentRouter.get(
  "/:paymentId/status",
  authenticate,
  paymentController.getStatus,
);

/**
 * @swagger
 * /api/payments/{paymentId}/refund:
 *   post:
 *     summary: Запросить возврат платежа
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Возврат инициирован
 */
paymentRouter.post(
  "/:paymentId/refund",
  authenticate,
  paymentController.refund,
);

export default paymentRouter;
