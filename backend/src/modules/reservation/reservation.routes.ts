import { Router } from "express";
import { authenticate, isAdmin } from "../../middleware/auth";
import { reservationController } from "./reservation.controller";

const router = Router();

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Получить список бронирований
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticate, reservationController.list);

/**
 * @swagger
 * /api/reservations/stats:
 *   get:
 *     summary: Получить статистику бронирований
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.get("/stats", authenticate, isAdmin, reservationController.getStats);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Получить детали бронирования
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
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
 */
router.put("/:id", authenticate, isAdmin, reservationController.update);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Удалить бронирование
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authenticate, isAdmin, reservationController.delete);

/**
 * @swagger
 * /api/reservations/{id}:
 *   patch:
 *     summary: Отменить бронирование
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.patch("/:id", authenticate, reservationController.cancel);

export default router;
