import { Router } from "express";
import { menuController } from "./menu.controller";

const router = Router();

/**
 * @swagger
 * /api/menu/items:
 *   get:
 *     summary: Получить список всех пунктов меню
 *     tags:
 *       - Menu
 *     responses:
 *       200:
 *         description: Список пунктов меню успешно получен
 */
router.get("/items", menuController.listItems);

/**
 * @swagger
 * /api/menu/items/{id}:
 *   get:
 *     summary: Получить пункт меню по ID
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пункт меню успешно получен
 *       404:
 *         description: Пункт меню не найден
 */
router.get("/items/:id", menuController.getItemById);

/**
 * @swagger
 * /api/menu/items:
 *   post:
 *     summary: Создать новый пункт меню
 *     tags:
 *       - Menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пункт меню успешно создан
 */
router.post("/items", menuController.createItem);

/**
 * @swagger
 * /api/menu/items/{id}:
 *   put:
 *     summary: Обновить пункт меню
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пункт меню успешно обновлен
 */
router.put("/items/:id", menuController.updateItem);

/**
 * @swagger
 * /api/menu/items/{id}:
 *   delete:
 *     summary: Удалить пункт меню
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пункт меню успешно удален
 */
router.delete("/items/:id", menuController.deleteItem);

/**
 * @swagger
 * /api/menu/assignments:
 *   get:
 *     summary: Получить список назначений меню объектам
 *     tags:
 *       - Menu
 *     responses:
 *       200:
 *         description: Список назначений успешно получен
 */
router.get("/assignments", menuController.listAssignments);

/**
 * @swagger
 * /api/menu/assignments:
 *   post:
 *     summary: Назначить или обновить пункт меню для объекта
 *     tags:
 *       - Menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookableObjectId
 *               - menuItemId
 *             properties:
 *               bookableObjectId:
 *                 type: integer
 *               menuItemId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Назначение успешно создано/обновлено
 */
router.post("/assignments", menuController.upsertAssignment);

/**
 * @swagger
 * /api/menu/assignments/{bookableObjectId}/{menuItemId}:
 *   delete:
 *     summary: Удалить назначение меню для объекта
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: bookableObjectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Назначение успешно удалено
 */
router.delete(
  "/assignments/:bookableObjectId/:menuItemId",
  menuController.deleteAssignment,
);

export default router;
