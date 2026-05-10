import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { authController } from "./auth.controller";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags:
 *       - Auth
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags:
 *       - Auth
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить токены доступа
 *     tags:
 *       - Auth
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход пользователя
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Запросить сброс пароля
 *     tags:
 *       - Auth
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Сбросить пароль
 *     tags:
 *       - Auth
 */
router.post("/reset-password", authController.resetPassword);

export default router;
