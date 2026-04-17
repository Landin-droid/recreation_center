import { Prisma, ReservationStatus } from "@prisma/client";
import { MENU_SUPPORTED_OBJECT_TYPES } from "../../common/constants";
import { AppError } from "../../middleware/errorHandler";
import {
  CreateReservationInput,
  ListReservationsQuery,
  ReservationMenuItemInput,
  reservationSchema,
  UpdateReservationInput,
} from "./reservation.validation";
import {
  reservationInclude,
  reservationRepository,
  ReservationWithRelations,
} from "./reservation.repository";
import prisma from "../../lib/prisma";
import dayjs from "dayjs";

const formatReservation = (reservation: ReservationWithRelations) => ({
  reservationId: reservation.reservationId,
  reservationDate: reservation.reservationDate,
  creationDate: reservation.creationDate,
  guestsCount: reservation.guestsCount,
  totalSum: Number(reservation.totalSum),
  notes: reservation.notes,
  status: reservation.status,
  user: {
    userId: reservation.user.userId,
    fullName: reservation.user.fullName,
    email: reservation.user.email,
    phoneNumber: reservation.user.phoneNumber,
  },
  bookableObject: {
    bookableObjectId: reservation.bookableObject.bookableObjectId,
    name: reservation.bookableObject.name,
    type: reservation.bookableObject.type,
    basePrice: Number(reservation.bookableObject.basePrice),
  },
  menuItems: reservation.reservationMenuItems.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    itemCost: Number(item.itemCost),
    menuItem: {
      name: item.menuItem.name,
      price: Number(item.menuItem.price),
    },
  })),
  invoice: reservation.invoice
    ? {
        invoiceId: reservation.invoice.invoiceId,
        dueDate: reservation.invoice.dueDate,
        totalAmount: Number(reservation.invoice.totalAmount),
        payment: reservation.invoice.payment
          ? {
              paymentId: reservation.invoice.payment.paymentId,
              amount: Number(reservation.invoice.payment.amount),
              status: reservation.invoice.payment.status,
              method: reservation.invoice.payment.method,
            }
          : null,
      }
    : null,
});

const isReservationWithinSeason = (
  reservationDate: Date,
  seasonStart: Date | null,
  seasonEnd: Date | null,
) => {
  if (!seasonStart || !seasonEnd) {
    return false;
  }

  const reservationTime = reservationDate.getTime();
  return (
    reservationTime >= seasonStart.getTime() &&
    reservationTime <= seasonEnd.getTime()
  );
};

const buildReservationDerivedData = async (
  input: CreateReservationInput,
  reservationIdToExclude?: number,
) => {
  const [user, bookableObject] = await Promise.all([
    reservationRepository.findUserById(input.userId),
    reservationRepository.findBookableObjectById(input.bookableObjectId),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!bookableObject) {
    throw new AppError("Bookable object not found", 404);
  }

  if (input.guestsCount > bookableObject.capacity) {
    throw new AppError("Guests count exceeds bookable object capacity", 400);
  }

  const reservationDate = new Date(input.reservationDate);
  if (
    bookableObject.isSeasonal &&
    !isReservationWithinSeason(
      reservationDate,
      bookableObject.seasonStart,
      bookableObject.seasonEnd,
    )
  ) {
    throw new AppError("Reservation is not within the seasonal period", 400);
  }

  const conflictingReservation =
    await reservationRepository.findConflictingReservation(
      input.bookableObjectId,
      reservationDate,
      reservationIdToExclude,
    );

  if (conflictingReservation) {
    throw new AppError("Conflicting reservation found", 409);
  }

  const menuItems = input.menuItems ?? [];
  if (
    menuItems.length > 0 &&
    !MENU_SUPPORTED_OBJECT_TYPES.includes(bookableObject.type)
  ) {
    throw new AppError(
      "The selected bookable object does not support menu items",
      400,
    );
  }

  const menuItemIds = [...new Set(menuItems.map((item) => item.menuItemId))];
  const assignments =
    menuItemIds.length > 0
      ? await reservationRepository.findAvailableAssignments(
          input.bookableObjectId,
          menuItemIds,
        )
      : [];

  if (assignments.length !== menuItemIds.length) {
    throw new AppError(
      "One or more menu items are not available for the selected bookable object",
      400,
    );
  }

  const assignmentMap = new Map(
    assignments.map((entry) => [entry.menuItemId, entry.menuItem]),
  );
  const reservationMenuItemsCreate = menuItems.map((item) => {
    const menuItem = assignmentMap.get(item.menuItemId);
    if (!menuItem) {
      throw new AppError(
        "Selected menu item is not available for the selected bookable object",
        400,
      );
    }

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      itemCost: Number(menuItem.price) * item.quantity,
    };
  });

  const totalMenuCost = reservationMenuItemsCreate.reduce(
    (sum, item) => sum + item.itemCost,
    0,
  );

  return {
    reservationDate,
    totalSum: Number(bookableObject.basePrice) + totalMenuCost,
    reservationMenuItemsCreate,
  };
};

export const reservationService = {
  async listReservations(query: ListReservationsQuery) {
    const reservations = await reservationRepository.findMany({
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.bookableObjectId
        ? { bookableObjectId: query.bookableObjectId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    });

    return reservations.map(formatReservation);
  },

  async getReservationById(reservationId: number) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    return formatReservation(reservation);
  },

  async createReservation(data: CreateReservationInput) {
    const derived = await buildReservationDerivedData(data);

    const reservation = await reservationRepository.create({
      user: {
        connect: { userId: data.userId },
      },
      bookableObject: {
        connect: { bookableObjectId: data.bookableObjectId },
      },
      reservationDate: derived.reservationDate,
      guestsCount: data.guestsCount,
      notes: data.notes,
      status: data.status ?? ReservationStatus.pending,
      totalSum: derived.totalSum,
      reservationMenuItems: {
        create: derived.reservationMenuItemsCreate,
      },
    });

    // Автоматически создать счёт при бронировании
    const dueDate = dayjs().add(1, "day").toDate();
    await prisma.invoice.create({
      data: {
        reservationId: reservation.reservationId,
        dueDate,
        totalAmount: new Prisma.Decimal(derived.totalSum),
      },
    });

    return formatReservation(reservation);
  },

  async updateReservation(reservationId: number, data: UpdateReservationInput) {
    const existing = await reservationRepository.findBaseById(reservationId);
    if (!existing) {
      throw new AppError("Reservation not found", 404);
    }

    const normalizedPayload = reservationSchema.parse({
      userId: data.userId ?? existing.userId,
      bookableObjectId: data.bookableObjectId ?? existing.bookableObjectId,
      reservationDate:
        data.reservationDate ?? existing.reservationDate.toISOString(),
      guestsCount: data.guestsCount ?? existing.guestsCount,
      notes: data.notes ?? existing.notes ?? undefined,
      status: data.status ?? existing.status,
      menuItems:
        data.menuItems ??
        existing.reservationMenuItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
    });

    const derived = await buildReservationDerivedData(
      normalizedPayload,
      reservationId,
    );

    const reservation = await reservationRepository.runInTransaction(
      async (tx) => {
        await tx.reservationMenuItem.deleteMany({ where: { reservationId } });

        await tx.reservation.update({
          where: { reservationId },
          data: {
            user: { connect: { userId: normalizedPayload.userId } },
            bookableObject: {
              connect: { bookableObjectId: normalizedPayload.bookableObjectId },
            },
            reservationDate: derived.reservationDate,
            guestsCount: normalizedPayload.guestsCount,
            notes: normalizedPayload.notes,
            status: normalizedPayload.status ?? existing.status,
            totalSum: derived.totalSum,
            reservationMenuItems: {
              create: derived.reservationMenuItemsCreate,
            },
          },
        });

        await tx.invoice.updateMany({
          where: { reservationId },
          data: { totalAmount: derived.totalSum },
        });

        return tx.reservation.findUniqueOrThrow({
          where: { reservationId },
          include: reservationInclude,
        });
      },
    );

    return formatReservation(reservation);
  },

  async deleteReservation(reservationId: number) {
    const existing = await reservationRepository.findBaseById(reservationId);
    if (!existing) {
      throw new AppError("Reservation not found", 404);
    }

    return reservationRepository.delete(reservationId);
  },
};
