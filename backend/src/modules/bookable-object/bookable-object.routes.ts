import { Router } from "express";
import { bookableObjectController } from "./bookable-object.controller";

const router = Router();

/**
 * @swagger
 * /api/bookable-objects:
 *   get:
 *     summary: Получить список всех доступных объектов
 *     tags:
 *       - Bookable Objects
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ["COTTAGE", "BANQUET_HALL", "GAZEBO", "KARAOKE_BAR", "OUTDOOR_VENUE"]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *     responses:
 *       200:
 *         description: Список объектов успешно получен
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
 *                     $ref: '#/components/schemas/BookableObject'
 */
router.get("/", bookableObjectController.list);

/**
 * @swagger
 * /api/bookable-objects/{id}:
 *   get:
 *     summary: Получить объект по ID
 *     tags:
 *       - Bookable Objects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID объекта
 *     responses:
 *       200:
 *         description: Объект успешно получен
 *       404:
 *         description: Объект не найден
 */
router.get("/:id", bookableObjectController.getById);

/**
 * @swagger
 * /api/bookable-objects:
 *   post:
 *     summary: Создать новый доступный объект
 *     tags:
 *       - Bookable Objects
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - capacity
 *               - basePrice
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Коттедж у озера"
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               basePrice:
 *                 type: number
 *                 example: 5000.50
 *               type:
 *                 type: string
 *                 enum: ["COTTAGE", "BANQUET_HALL", "GAZEBO", "KARAOKE_BAR", "OUTDOOR_VENUE"]
 *               description:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isSeasonal:
 *                 type: boolean
 *                 default: false
 *               seasonStart:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: "Требуется если isSeasonal=true"
 *               seasonEnd:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: "Требуется если isSeasonal=true"
 *               details:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   amenities:
 *                     type: string
 *                   bedrooms:
 *                     type: integer
 *                   squareMeters:
 *                     type: integer
 *                   maxTables:
 *                     type: integer
 *                   tablesAmount:
 *                     type: integer
 *     responses:
 *       201:
 *         description: Объект успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BookableObject'
 */
router.post("/", bookableObjectController.create);

/**
 * @swagger
 * /api/bookable-objects/{id}:
 *   put:
 *     summary: Обновить объект
 *     tags:
 *       - Bookable Objects
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
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               basePrice:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: ["COTTAGE", "BANQUET_HALL", "GAZEBO", "KARAOKE_BAR", "OUTDOOR_VENUE"]
 *               description:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *               isSeasonal:
 *                 type: boolean
 *               seasonStart:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               seasonEnd:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               details:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Объект успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BookableObject'
 */
router.put("/:id", bookableObjectController.update);

/**
 * @swagger
 * /api/bookable-objects/{id}:
 *   delete:
 *     summary: Удалить объект
 *     tags:
 *       - Bookable Objects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Объект успешно удален
 */
router.delete("/:id", bookableObjectController.delete);

export default router;
