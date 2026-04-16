import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export const rentalItemInclude = {
  priceRules: true,
} satisfies Prisma.RentalItemInclude;

export type RentalItemWithRelations = Prisma.RentalItemGetPayload<{
  include: typeof rentalItemInclude;
}>;

export const rentalRepository = {
  findRentalItems: () =>
    prisma.rentalItem.findMany({
      include: rentalItemInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),

  findRentalItemById: (rentalItemId: number) =>
    prisma.rentalItem.findUnique({
      where: { rentalItemId },
      include: rentalItemInclude,
    }),

  findRentalItemBaseById: (rentalItemId: number) =>
    prisma.rentalItem.findUnique({
      where: { rentalItemId },
    }),

  createRentalItem: (data: Prisma.RentalItemCreateInput) =>
    prisma.rentalItem.create({
      data,
      include: rentalItemInclude,
    }),

  updateRentalItem: (rentalItemId: number, data: Prisma.RentalItemUpdateInput) =>
    prisma.rentalItem.update({
      where: { rentalItemId },
      data,
      include: rentalItemInclude,
    }),

  deleteRentalItem: (rentalItemId: number) =>
    prisma.rentalItem.delete({
      where: { rentalItemId },
    }),

  findPriceRules: (where: Prisma.RentalPriceRuleWhereInput) =>
    prisma.rentalPriceRule.findMany({
      where,
      include: {
        rentalItem: true,
      },
      orderBy: [{ rentalItemId: "asc" }, { passengerType: "asc" }],
    }),

  findPriceRuleById: (ruleId: number) =>
    prisma.rentalPriceRule.findUnique({
      where: { ruleId },
      include: {
        rentalItem: true,
      },
    }),

  createPriceRule: (data: Prisma.RentalPriceRuleCreateInput) =>
    prisma.rentalPriceRule.create({
      data,
      include: {
        rentalItem: true,
      },
    }),

  updatePriceRule: (ruleId: number, data: Prisma.RentalPriceRuleUpdateInput) =>
    prisma.rentalPriceRule.update({
      where: { ruleId },
      data,
      include: {
        rentalItem: true,
      },
    }),

  deletePriceRule: (ruleId: number) =>
    prisma.rentalPriceRule.delete({
      where: { ruleId },
    }),
};
