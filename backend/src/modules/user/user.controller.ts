import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { env, jwtSecret } from "../../config/env";
import { userService } from "./user.service";
import {
  createUserSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "./user.validation";

const formatUserResponse = (user: {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: Date;
  role: string;
}) => ({
  userId: user.userId,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  registrationDate: user.registrationDate,
  role: user.role,
});

const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true, // Всегда true для HTTPS на Render
    sameSite: "none", // Нужно для кросс-доменных кук
    maxAge: 15 * 60 * 1000, // 15 минут
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  });
};

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.listUsers();
    res.json({ success: true, data: users.map(formatUserResponse) });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const validated = createUserSchema.parse(req.body);
    const user = await userService.registerUser(validated);

    const { accessToken, refreshToken } = await userService.createAuthTokens(
      user.userId,
      user.email,
    );

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      data: formatUserResponse(user),
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const validated = loginSchema.parse(req.body);
    const user = await userService.verifyPassword(
      validated.email,
      validated.password,
    );

    const { accessToken, refreshToken } = await userService.createAuthTokens(
      user.userId,
      user.email,
    );

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: formatUserResponse(user),
    });
  }),

  // ✅ Обновить токены используя refresh token
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(401).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    try {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await userService.refreshTokens(refreshToken);

      setTokenCookies(res, newAccessToken, newRefreshToken);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      throw error;
    }
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.user!.userId);
    res.json({ success: true, data: formatUserResponse(user) });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "user");
    const user = await userService.getUserById(id);
    res.json({ success: true, data: formatUserResponse(user) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "user");
    const validated = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(id, validated);
    res.json({ success: true, data: formatUserResponse(user) });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "user");
    await userService.deleteUser(id);
    res.status(204).send();
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await userService.logout(userId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Successfully logged out",
    });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const validated = forgotPasswordSchema.parse(req.body);
    const resetToken = await userService.forgotPassword(validated.email);
    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      data: { resetToken }, // Возвращаем токен для EmailJS на фронтенде
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const validated = resetPasswordSchema.parse(req.body);
    await userService.resetPassword(validated.token, validated.password);
    res.json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  }),
};
