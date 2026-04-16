import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { jwtSecret } from "../../config/env";
import { userService } from "./user.service";
import {
  createUserSchema,
  loginSchema,
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

    res.status(201).json({
      success: true,
      data: {
        ...formatUserResponse(user),
        accessToken,
        refreshToken,
      },
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

    res.json({
      success: true,
      data: {
        ...formatUserResponse(user),
        accessToken,
        refreshToken,
      },
    });
  }),

  // ✅ Обновить токены используя refresh token
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await userService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
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
};
