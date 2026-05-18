import { Router } from "express";
import { authenticate, isAdmin } from "../../middleware/auth";
import { userController } from "./user.controller";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticate, isAdmin, userController.list);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 */
router.get("/profile", authenticate, userController.getProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", authenticate, isAdmin, userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить данные пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", authenticate, userController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authenticate, isAdmin, userController.delete);

export default router;
