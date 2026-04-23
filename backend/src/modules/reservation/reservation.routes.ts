import { Router } from "express";
import { reservationController } from "./reservation.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Получить список бронирований пользователя
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список бронирований успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: Не авторизован
 */
router.get("/", authenticate, reservationController.list);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Получить детали бронирования
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID бронирования
 *     responses:
 *       200:
 *         description: Информация о бронировании успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Бронирование не найдено
 */
router.get("/:id", authenticate, reservationController.getById);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Создать новое бронирование
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - bookableObjectId
 *               - reservationDate
 *               - guestsCount
 *             properties:
 *               userId:
 *                 type: integer
 *               bookableObjectId:
 *                 type: integer
 *               reservationDate:
 *                 type: string
 *                 format: date
 *                 description: "Дата в формате YYYY-MM-DD"
 *                 example: "2026-05-15"
 *               guestsCount:
 *                 type: integer
 *                 minimum: 1
 *               notes:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: ["pending", "confirmed", "cancelled"]
 *                 nullable: true
 *               menuItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuItemId
 *                     - quantity
 *                   properties:
 *                     menuItemId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       201:
 *         description: Бронирование успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Ошибка валидации данных
 */
router.post("/", authenticate, reservationController.create);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Обновить бронирование
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               bookableObjectId:
 *                 type: integer
 *               reservationDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-15"
 *               guestsCount:
 *                 type: integer
 *                 minimum: 1
 *               notes:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: ["pending", "confirmed", "cancelled"]
 *               menuItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Бронирование успешно обновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 */
router.put("/:id", authenticate, reservationController.update);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Удалить бронирование
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Бронирование успешно удалено
 */
router.delete("/:id", authenticate, reservationController.delete);

/**
 * @swagger
 * /api/reservations/{id}/payment/initiate:
 *   post:
 *     summary: Инициировать платеж для бронирования
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Платеж успешно инициирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentInitiateResponse'
 */
router.post(
  "/:id/payment/initiate",
  authenticate,
  reservationController.initiatePayment,
);

/**
 * @swagger
 * /api/reservations/{id}/payment:
 *   get:
 *     summary: Получить информацию о платеже бронирования
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Информация о платеже получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                       nullable: true
 */
router.get("/:id/payment", authenticate, reservationController.getPayment);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   post:
 *     summary: Отменить бронирование
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: "Причина отмены (опционально)"
 *     responses:
 *       200:
 *         description: Бронирование успешно отменено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 */
router.post("/:id/cancel", authenticate, reservationController.cancel);

export default router;
