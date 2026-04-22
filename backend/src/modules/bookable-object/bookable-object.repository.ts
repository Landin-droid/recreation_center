import { Prisma } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";

export const bookableObjectInclude = {
  cottage: true,
  gazebo: true,
  banquetHall: true,
  outdoorVenue: true,
  karaokeBar: true,
  objectMenuItems: {
    include: {
      menuItem: true,
    },
  },
} satisfies Prisma.BookableObjectInclude;

export type BookableObjectWithRelations = Prisma.BookableObjectGetPayload<{
  include: typeof bookableObjectInclude;
}>;

export const bookableObjectRepository = {
  findMany: (where: Prisma.BookableObjectWhereInput) =>
    prisma.bookableObject.findMany({
      where,
      include: bookableObjectInclude,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),

  findById: (bookableObjectId: number) =>
    prisma.bookableObject.findUnique({
      where: { bookableObjectId },
      include: bookableObjectInclude,
    }),

  findBaseById: (bookableObjectId: number) =>
    prisma.bookableObject.findUnique({
      where: { bookableObjectId },
    }),

  create: (data: Prisma.BookableObjectCreateInput) =>
    prisma.bookableObject.create({
      data,
      include: bookableObjectInclude,
    }),

  delete: (bookableObjectId: number) =>
    prisma.bookableObject.delete({
      where: { bookableObjectId },
    }),

  runInTransaction: <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) =>
    prisma.$transaction(callback),
};
