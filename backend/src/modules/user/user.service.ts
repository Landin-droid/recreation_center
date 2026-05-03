import { Prisma } from "../../generated/prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto, { randomBytes, createHash } from "crypto";
import { AppError } from "../../middleware/errorHandler";
import { env, jwtSecret } from "../../config/env";
import { userRepository } from "./user.repository";
import { emailService } from "../../lib/email";
import { CreateUserInput, UpdateUserInput } from "./user.validation";
import { UserInternal, UserResponse } from "./user.types";

const toUserResponse = (user: UserInternal): UserResponse => ({
  userId: user.userId,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  registrationDate: user.registrationDate,
  role: user.role,
});

// ✅ Вспомогательные функции для работы с токенами
const generateRefreshTokenString = (): string => {
  return randomBytes(32).toString("hex");
};

/**
 * Используем HMAC для "шифрования" токена в БД.
 * Это обеспечивает защиту от утечки БД (нельзя получить токены без ключа)
 * и позволяет искать по значению.
 */
const encryptRefreshToken = (token: string): string => {
  return crypto
    .createHmac("sha256", env.REFRESH_TOKEN_ENCRYPTION_KEY)
    .update(token)
    .digest("hex");
};

const hashPasswordResetToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

const generateAuthTokens = (
  userId: number,
  email: string,
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ userId, email }, jwtSecret, {
    expiresIn: "15m",
  });
  const refreshToken = generateRefreshTokenString();
  return { accessToken, refreshToken };
};

export const userService = {
  async listUsers() {
    const users = await userRepository.findMany();
    return users.map(toUserResponse);
  },

  async registerUser(data: CreateUserInput) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email is already in use", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const prismaData: Prisma.UserCreateInput = {
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: "USER",
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
    };

    const user = await userRepository.create(prismaData);
    return toUserResponse(user);
  },

  async verifyPassword(email: string, password: string) {
    const user = (await userRepository.findByEmail(
      email,
    )) as UserInternal | null;

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }

    return toUserResponse(user);
  },

  async getUserById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return toUserResponse(user);
  },

  async updateUser(id: number, data: UpdateUserInput) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await userRepository.findByEmail(data.email);
      if (emailExists) {
        throw new AppError("Email is already in use", 409);
      }
    }

    const prismaData: Prisma.UserUpdateInput = {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phoneNumber !== undefined
        ? { phoneNumber: data.phoneNumber }
        : {}),
    };

    const updated = await userRepository.update(id, prismaData);
    return toUserResponse(updated);
  },

  async deleteUser(id: number) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    return userRepository.delete(id);
  },

  async createAuthTokens(userId: number, email: string) {
    const { accessToken, refreshToken } = generateAuthTokens(userId, email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const encryptedRefreshToken = encryptRefreshToken(refreshToken);

    await userRepository.storeRefreshToken(
      userId,
      encryptedRefreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  },

  async validateRefreshToken(refreshToken: string) {
    const tokenHash = encryptRefreshToken(refreshToken);

    const storedToken = await userRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new AppError("Refresh token not found", 401);
    }

    // Проверить, что токен не отозван
    if (storedToken.revokedAt) {
      throw new AppError("Refresh token has been revoked", 401);
    }

    // Проверить срок действия
    if (new Date() > storedToken.expiresAt) {
      throw new AppError("Refresh token has expired", 401);
    }

    return storedToken.user;
  },

  async refreshTokens(refreshToken: string) {
    const user = await this.validateRefreshToken(refreshToken);

    // Отозвать старый токен
    const oldTokenHash = encryptRefreshToken(refreshToken);
    await userRepository.revokeRefreshToken(oldTokenHash);

    // Создать новую пару
    return this.createAuthTokens(user.userId, user.email);
  },

  async logout(userId: number) {
    await userRepository.revokeAllUserTokens(userId);
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Для безопасности не говорим, что email не найден, но возвращаем null
      return null;
    }

    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 час

    await userRepository.updateResetToken(
      email,
      hashPasswordResetToken(resetToken),
      expiresAt,
    );
    
    // Мы всё еще вызываем emailService (заглушку), но теперь возвращаем токен
    // чтобы фронтенд мог отправить его через EmailJS
    await emailService.sendPasswordResetEmail(email, resetToken);
    
    return resetToken;
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await userRepository.findByResetToken(
      hashPasswordResetToken(token),
    );
    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    await userRepository.update(user.userId, { passwordHash });
    await userRepository.clearResetToken(user.userId);
    await userRepository.revokeAllUserTokens(user.userId); // Логаут со всех устройств
  },
};
