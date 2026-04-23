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
 *               - bookableObjectId
 *               - rentalDateStart
 *               - rentalDateEnd
 *             properties:
 *               bookableObjectId:
 *                 type: integer
 *               rentalDateStart:
 *                 type: string
 *                 format: date-time
 *               rentalDateEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Бронирование успешно создано
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
 *               rentalDateStart:
 *                 type: string
 *                 format: date-time
 *               rentalDateEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Бронирование успешно обновлено
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
 *       200:
 *         description: Платеж успешно инициирован
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
 *     responses:
 *       200:
 *         description: Бронирование успешно отменено
 */
router.post("/:id/cancel", authenticate, reservationController.cancel);

export default router;
