import prisma from "../../lib/prisma";
import { Prisma, Customer } from "@prisma/client";

export const customerRepository = {
  // ✅ findById: возвращает Promise<Customer | null>
  findById: (id: number) =>
    prisma.customer.findUnique({
      where: { customerId: id },
    }),

  // ✅ findByEmail: возвращает Promise<Customer | null>
  findByEmail: (email: string) =>
    prisma.customer.findUnique({
      where: { email },
    }),

  // ✅ create: используем Prisma тип для входных данных
  create: (data: Prisma.CustomerCreateInput) =>
    prisma.customer.create({ data }),

  // ✅ update: используем Prisma тип для входных данных
  update: (id: number, data: Prisma.CustomerUpdateInput) =>
    prisma.customer.update({
      where: { customerId: id },
      data,
    }),

  // ✅ delete: мягкое удаление или полное (по необходимости)
  delete: (id: number) =>
    prisma.customer.delete({
      where: { customerId: id },
    }),
};
