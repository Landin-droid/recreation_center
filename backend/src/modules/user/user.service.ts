import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { AppError } from "../../middleware/errorHandler";
import { jwtSecret } from "../../config/env";
import { userRepository } from "./user.repository";
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

const hashRefreshToken = (token: string): string => {
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
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await userRepository.storeRefreshToken(userId, refreshTokenHash, expiresAt);

    return { accessToken, refreshToken };
  },

  async validateRefreshToken(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);

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
    const oldTokenHash = hashRefreshToken(refreshToken);
    await userRepository.revokeRefreshToken(oldTokenHash);

    // Создать новую пару
    return this.createAuthTokens(user.userId, user.email);
  },
};
