import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export const customerRepository = {
  findMany: () =>
    prisma.customer.findMany({
      orderBy: [{ registrationDate: "desc" }, { customerId: "desc" }],
    }),

  findById: (id: number) =>
    prisma.customer.findUnique({
      where: { customerId: id },
    }),

  findByEmail: (email: string) =>
    prisma.customer.findUnique({
      where: { email },
    }),

  create: (data: Prisma.CustomerCreateInput) =>
    prisma.customer.create({ data }),

  update: (id: number, data: Prisma.CustomerUpdateInput) =>
    prisma.customer.update({
      where: { customerId: id },
      data,
    }),

  delete: (id: number) =>
    prisma.customer.delete({
      where: { customerId: id },
    }),

  storeRefreshToken: (customerId: number, tokenHash: string, expiresAt: Date) =>
    prisma.refreshToken.create({
      data: {
        customerId,
        tokenHash,
        expiresAt,
      },
    }),

  findRefreshTokenByHash: (tokenHash: string) =>
    prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { customer: true },
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

  revokeAllCustomerTokens: (customerId: number) =>
    prisma.refreshToken.updateMany({
      where: { customerId },
      data: { revokedAt: new Date() },
    }),
};
