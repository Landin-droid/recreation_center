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
 *     responses:
 *       200:
 *         description: Список пользователей успешно получен
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
 *                     $ref: '#/components/schemas/User'
 */
router.get("/", userController.list);

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 example: "Иван Петров"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ivan@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: "Минимум 8 символов, должна содержать хотя бы одну заглавную букву, строчную букву и цифру"
 *                 example: "SecurePass123"
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *                 pattern: '^\+?[0-9\s\-()]{10,20}$'
 *                 example: "+79991234567"
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserWithTokens'
 *       400:
 *         description: Ошибка валидации данных
 */
router.post("/register", userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Вход пользователя
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ivan@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Вход выполнен успешно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserWithTokens'
 *       401:
 *         description: Неверные учетные данные
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Обновить токены доступа
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token полученный при входе
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Невалидный refresh token
 */
router.post("/refresh", userController.refresh);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Выход пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     description: Отзывает refresh token текущего пользователя, делая его недействительным
 *     responses:
 *       200:
 *         description: Пользователь успешно вышел из системы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Не авторизован
 */
router.post("/logout", authenticate, userController.logout);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 */
router.get("/profile", authenticate, userController.getProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 */
router.get("/:id", userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить данные пользователя
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *                 pattern: '^\+?[0-9\s\-()]{10,20}$'
 *     responses:
 *       200:
 *         description: Пользователь успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 */
router.put("/:id", userController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь успешно удален
 *       404:
 *         description: Пользователь не найден
 */
router.delete("/:id", userController.delete);

export default router;
