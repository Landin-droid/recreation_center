import { Prisma } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";

export const reservationInclude = {
  user: true,
  bookableObject: true,
  reservationMenuItems: {
    include: {
      menuItem: true,
    },
  },
  payment: true,
} satisfies Prisma.ReservationInclude;

export type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

export const reservationRepository = {
  findMany: (where: Prisma.ReservationWhereInput) =>
    prisma.reservation.findMany({
      where,
      include: reservationInclude,
      orderBy: [{ reservationDate: "desc" }, { reservationId: "desc" }],
    }),

  findById: (reservationId: number) =>
    prisma.reservation.findUnique({
      where: { reservationId },
      include: reservationInclude,
    }),

  findBaseById: (reservationId: number) =>
    prisma.reservation.findUnique({
      where: { reservationId },
      include: {
        reservationMenuItems: true,
      },
    }),

  findUserById: (userId: number) =>
    prisma.user.findUnique({
      where: { userId },
    }),

  findBookableObjectById: (bookableObjectId: number) =>
    prisma.bookableObject.findUnique({
      where: { bookableObjectId },
    }),

  findConflictingReservation: (
    bookableObjectId: number,
    reservationDate: Date,
    reservationIdToExclude?: number,
  ) =>
    prisma.reservation.findFirst({
      where: {
        bookableObjectId,
        reservationDate,
        status: {
          notIn: ["cancelled", "expired"],
        },
        ...(reservationIdToExclude
          ? { reservationId: { not: reservationIdToExclude } }
          : {}),
      },
    }),

  findAvailableAssignments: (bookableObjectId: number, menuItemIds: number[]) =>
    prisma.objectMenuItem.findMany({
      where: {
        bookableObjectId,
        menuItemId: { in: menuItemIds },
        isAvailable: true,
        menuItem: {
          isAvailable: true,
        },
      },
      include: {
        menuItem: true,
      },
    }),

  create: (data: Prisma.ReservationCreateInput) =>
    prisma.reservation.create({
      data,
      include: reservationInclude,
    }),

  runInTransaction: <T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ) => prisma.$transaction(callback),

  delete: (reservationId: number) =>
    prisma.reservation.delete({
      where: { reservationId },
    }),
};
