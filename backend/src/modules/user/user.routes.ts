import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { userController } from "./user.controller";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags:
 *       - Users
 */
router.get("/", userController.list);

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
 */
router.get("/:id", userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить данные пользователя
 *     tags:
 *       - Users
 */
router.put("/:id", userController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя
 *     tags:
 *       - Users
 */
router.delete("/:id", userController.delete);

export default router;
