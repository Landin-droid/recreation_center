import bcrypt from "bcryptjs";
import crypto, { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { env, jwtSecret } from "../../config/env";
import { AppError } from "../../middleware/errorHandler";
import { UserRepository, userRepository } from "../user/user.repository";
import { UserService, userService } from "../user/user.service";
import { CreateUserInput } from "../user/user.validation";

const generateRefreshTokenString = (): string => {
  return randomBytes(32).toString("hex");
};

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
  role: string,
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ userId, email, role }, jwtSecret, {
    expiresIn: "15m",
  });
  const refreshToken = generateRefreshTokenString();
  return { accessToken, refreshToken };
};

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
  ) {}

  async register(data: CreateUserInput) {
    const user = await this.userService.registerUser(data);
    const tokens = await this.createAuthTokens(user.userId, user.email, user.role);

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.userService.verifyPassword(email, password);
    const tokens = await this.createAuthTokens(user.userId, user.email, user.role);

    return { user, ...tokens };
  }

  async createAuthTokens(userId: number, email: string, role: string) {
    const { accessToken, refreshToken } = generateAuthTokens(userId, email, role);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const encryptedRefreshToken = encryptRefreshToken(refreshToken);

    await this.userRepository.storeRefreshToken(
      userId,
      encryptedRefreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(refreshToken: string) {
    const tokenHash = encryptRefreshToken(refreshToken);

    const storedToken = await this.userRepository.findRefreshTokenByHash(
      tokenHash,
    );

    if (!storedToken) {
      throw new AppError("Refresh token not found", 401);
    }

    if (storedToken.revokedAt) {
      throw new AppError("Refresh token has been revoked", 401);
    }

    if (new Date() > storedToken.expiresAt) {
      throw new AppError("Refresh token has expired", 401);
    }

    return storedToken.user;
  }

  async refreshTokens(refreshToken: string) {
    const user = await this.validateRefreshToken(refreshToken);

    const oldTokenHash = encryptRefreshToken(refreshToken);
    await this.userRepository.revokeRefreshToken(oldTokenHash);

    return this.createAuthTokens(user.userId, user.email, user.role);
  }

  async logout(userId: number) {
    await this.userRepository.revokeAllUserTokens(userId);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.userRepository.updateResetToken(
      email,
      hashPasswordResetToken(resetToken),
      expiresAt,
    );

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findByResetToken(
      hashPasswordResetToken(token),
    );
    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.userRepository.update(user.userId, { passwordHash });
    await this.userRepository.clearResetToken(user.userId);
    await this.userRepository.revokeAllUserTokens(user.userId);
  }
}

export const authService = new AuthService(userRepository, userService);
