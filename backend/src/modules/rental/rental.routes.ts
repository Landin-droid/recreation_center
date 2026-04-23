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
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Автомобиль Toyota"
 *               description:
 *                 type: string
 *                 nullable: true
 *               category:
 *                 type: string
 *                 enum: ["VEHICLE", "EQUIPMENT", "FURNITURE", "OTHER"]
 *               pricePerHour:
 *                 type: number
 *                 nullable: true
 *               maxCapacity:
 *                 type: integer
 *                 nullable: true
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isSeasonal:
 *                 type: boolean
 *                 default: false
 *               seasonType:
 *                 type: string
 *                 enum: ["SUMMER", "WINTER", "YEAR_ROUND"]
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Предмет для аренды успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RentalItem'
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
 *                 minLength: 2
 *               description:
 *                 type: string
 *                 nullable: true
 *               category:
 *                 type: string
 *                 enum: ["VEHICLE", "EQUIPMENT", "FURNITURE", "OTHER"]
 *               pricePerHour:
 *                 type: number
 *                 nullable: true
 *               maxCapacity:
 *                 type: integer
 *                 nullable: true
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *               isSeasonal:
 *                 type: boolean
 *               seasonType:
 *                 type: string
 *                 enum: ["SUMMER", "WINTER", "YEAR_ROUND"]
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Предмет для аренды успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RentalItem'
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
 *     parameters:
 *       - in: query
 *         name: rentalItemId
 *         schema:
 *           type: integer
 *         description: "Фильтровать по ID предмета аренды (опционально)"
 *     responses:
 *       200:
 *         description: Список правил успешно получен
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
 *                     $ref: '#/components/schemas/RentalPriceRule'
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
 *               - rentalItemId
 *               - pricePerKm
 *               - passengerType
 *             properties:
 *               rentalItemId:
 *                 type: integer
 *               pricePerKm:
 *                 type: number
 *                 example: 15.50
 *               minKm:
 *                 type: integer
 *                 nullable: true
 *               maxKm:
 *                 type: integer
 *                 nullable: true
 *               passengerType:
 *                 type: string
 *                 enum: ["ADULT", "CHILD", "SENIOR"]
 *     responses:
 *       201:
 *         description: Правило успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RentalPriceRule'
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
 *               rentalItemId:
 *                 type: integer
 *               pricePerKm:
 *                 type: number
 *               minKm:
 *                 type: integer
 *                 nullable: true
 *               maxKm:
 *                 type: integer
 *                 nullable: true
 *               passengerType:
 *                 type: string
 *                 enum: ["ADULT", "CHILD", "SENIOR"]
 *     responses:
 *       200:
 *         description: Правило успешно обновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RentalPriceRule'
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
