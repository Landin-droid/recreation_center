import { Request, Response } from "express";
import { asyncHandler } from "../../common/http";
import {
  createUserSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../user/user.validation";
import { authService } from "./auth.service";

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
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const validated = createUserSchema.parse(req.body);
    const { user, accessToken, refreshToken } =
      await authService.register(validated);

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      data: formatUserResponse(user),
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const validated = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(
      validated.email,
      validated.password,
    );

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: formatUserResponse(user),
    });
  }),

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
        await authService.refreshTokens(refreshToken);

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

  logout: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await authService.logout(userId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Successfully logged out",
    });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const validated = forgotPasswordSchema.parse(req.body);
    const resetToken = await authService.forgotPassword(validated.email);
    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
      data: { resetToken },
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const validated = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(validated.token, validated.password);
    res.json({
      success: true,
      message:
        "Password has been reset successfully. Please log in with your new password.",
    });
  }),
};
