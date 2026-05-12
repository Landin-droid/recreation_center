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

export class BookableObjectRepository {
  findMany(where: Prisma.BookableObjectWhereInput) {
    return prisma.bookableObject.findMany({
      where,
      include: bookableObjectInclude,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }

  findById(bookableObjectId: number) {
    return prisma.bookableObject.findUnique({
      where: { bookableObjectId },
      include: bookableObjectInclude,
    });
  }

  findBaseById(bookableObjectId: number) {
    return prisma.bookableObject.findUnique({
      where: { bookableObjectId },
    });
  }

  create(data: Prisma.BookableObjectCreateInput) {
    return prisma.bookableObject.create({
      data,
      include: bookableObjectInclude,
    });
  }

  delete(bookableObjectId: number) {
    return prisma.bookableObject.delete({
      where: { bookableObjectId },
    });
  }

  runInTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }
}

export const bookableObjectRepository = new BookableObjectRepository();
