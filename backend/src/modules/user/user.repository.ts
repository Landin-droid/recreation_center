import { Prisma } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";

export const userRepository = {
  findMany: () =>
    prisma.user.findMany({
      orderBy: [{ registrationDate: "desc" }, { userId: "desc" }],
    }),

  findById: (id: number) =>
    prisma.user.findUnique({
      where: { userId: id },
    }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
    }),

  create: (data: Prisma.UserCreateInput) => prisma.user.create({ data }),

  update: (id: number, data: Prisma.UserUpdateInput) =>
    prisma.user.update({
      where: { userId: id },
      data,
    }),

  delete: (id: number) =>
    prisma.user.delete({
      where: { userId: id },
    }),

  storeRefreshToken: (userId: number, tokenHash: string, expiresAt: Date) =>
    prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    }),

  findRefreshTokenByHash: (tokenHash: string) =>
    prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    }),

  revokeRefreshToken: (tokenHash: string) =>
    prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    }),

  deleteExpiredTokens: () =>
    prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    }),

  revokeAllUserTokens: (userId: number) =>
    prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    }),

  updateResetToken: (email: string, token: string, expiresAt: Date) =>
    prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiresAt,
      },
    }),

  findByResetToken: (token: string) =>
    prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    }),

  clearResetToken: (userId: number) =>
    prisma.user.update({
      where: { userId },
      data: {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    }),
};
