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
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Объект успешно создан
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
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Объект успешно обновлен
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
