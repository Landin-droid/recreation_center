import { Router } from "express";
import { rentalController } from "./rental.controller";

const router = Router();

/**
 * @swagger
 * /api/rentals/items:
 *   get:
 *     summary: Получить список всех предметов для аренды
 *     tags:
 *       - Rentals
 *     responses:
 *       200:
 *         description: Список предметов для аренды успешно получен
 */
router.get("/items", rentalController.listItems);

/**
 * @swagger
 * /api/rentals/items/{id}:
 *   get:
 *     summary: Получить предмет для аренды по ID
 *     tags:
 *       - Rentals
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Предмет для аренды успешно получен
 *       404:
 *         description: Предмет не найден
 */
router.get("/items/:id", rentalController.getItemById);

/**
 * @swagger
 * /api/rentals/items:
 *   post:
 *     summary: Создать новый предмет для аренды
 *     tags:
 *       - Rentals
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - basePrice
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Предмет для аренды успешно создан
 */
router.post("/items", rentalController.createItem);

/**
 * @swagger
 * /api/rentals/items/{id}:
 *   put:
 *     summary: Обновить предмет для аренды
 *     tags:
 *       - Rentals
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Предмет для аренды успешно обновлен
 */
router.put("/items/:id", rentalController.updateItem);

/**
 * @swagger
 * /api/rentals/items/{id}:
 *   delete:
 *     summary: Удалить предмет для аренды
 *     tags:
 *       - Rentals
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Предмет для аренды успешно удален
 */
router.delete("/items/:id", rentalController.deleteItem);

/**
 * @swagger
 * /api/rentals/price-rules:
 *   get:
 *     summary: Получить список правил определения цены
 *     tags:
 *       - Rentals
 *     responses:
 *       200:
 *         description: Список правил успешно получен
 */
router.get("/price-rules", rentalController.listPriceRules);

/**
 * @swagger
 * /api/rentals/price-rules:
 *   post:
 *     summary: Создать новое правило определения цены
 *     tags:
 *       - Rentals
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - minDays
 *               - maxDays
 *               - discountPercent
 *             properties:
 *               minDays:
 *                 type: integer
 *               maxDays:
 *                 type: integer
 *               discountPercent:
 *                 type: number
 *     responses:
 *       201:
 *         description: Правило успешно создано
 */
router.post("/price-rules", rentalController.createPriceRule);

/**
 * @swagger
 * /api/rentals/price-rules/{id}:
 *   put:
 *     summary: Обновить правило определения цены
 *     tags:
 *       - Rentals
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
 *               minDays:
 *                 type: integer
 *               maxDays:
 *                 type: integer
 *               discountPercent:
 *                 type: number
 *     responses:
 *       200:
 *         description: Правило успешно обновлено
 */
router.put("/price-rules/:id", rentalController.updatePriceRule);

/**
 * @swagger
 * /api/rentals/price-rules/{id}:
 *   delete:
 *     summary: Удалить правило определения цены
 *     tags:
 *       - Rentals
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Правило успешно удалено
 */
router.delete("/price-rules/:id", rentalController.deletePriceRule);

export default router;
