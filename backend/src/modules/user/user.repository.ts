import { Prisma } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";

export class UserRepository {
  findMany() {
    return prisma.user.findMany({
      orderBy: [{ registrationDate: "desc" }, { userId: "desc" }],
    });
  }

  findById(id: number) {
    return prisma.user.findUnique({
      where: { userId: id },
    });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { userId: id },
      data,
    });
  }

  delete(id: number) {
    return prisma.user.delete({
      where: { userId: id },
    });
  }

  storeRefreshToken(userId: number, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  revokeAllUserTokens(userId: number) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }

  updateResetToken(email: string, token: string, expiresAt: Date) {
    return prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiresAt,
      },
    });
  }

  findByResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });
  }

  clearResetToken(userId: number) {
    return prisma.user.update({
      where: { userId },
      data: {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }
}

export const userRepository = new UserRepository();
