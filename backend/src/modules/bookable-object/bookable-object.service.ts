import {
  BanquetHall,
  BookableObjectType,
  Cottage,
  Gazebo,
  KaraokeBar,
  OutdoorVenue,
  Prisma,
} from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import {
  bookableObjectRepository,
  BookableObjectWithRelations,
  bookableObjectInclude,
} from "./bookable-object.repository";
import {
  CreateBookableObjectInput,
  ListBookableObjectsQuery,
  subtypeDetailsSchema,
  UpdateBookableObjectInput,
} from "./bookable-object.validation";

const buildSubtypeCreateData = (
  type: BookableObjectType,
  details: CreateBookableObjectInput["details"],
): Pick<Prisma.BookableObjectCreateInput, "cottage" | "gazebo" | "banquetHall" | "outdoorVenue" | "karaokeBar"> => {
  switch (type) {
    case BookableObjectType.cottage:
      return {
        cottage: {
          create: {
            amenities: details?.amenities,
            bedrooms: details?.bedrooms,
            squareMeters: details?.squareMeters,
          },
        },
      };
    case BookableObjectType.gazebo:
      return {
        gazebo: {
          create: {
            amenities: details?.amenities,
          },
        },
      };
    case BookableObjectType.banquet_hall:
      return {
        banquetHall: {
          create: {
            maxTables: details?.maxTables,
          },
        },
      };
    case BookableObjectType.outdoor_venue:
      return {
        outdoorVenue: {
          create: {},
        },
      };
    case BookableObjectType.karaoke_bar:
      return {
        karaokeBar: {
          create: {
            tablesAmount: details?.tablesAmount,
          },
        },
      };
  }
};

const buildSubtypeUpdateOperations = (
  type: BookableObjectType,
  details: UpdateBookableObjectInput["details"],
): Prisma.BookableObjectUpdateInput => {
  if (!details) {
    return {};
  }

  switch (type) {
    case BookableObjectType.cottage:
      return {
        cottage: {
          upsert: {
            create: {
              amenities: details.amenities,
              bedrooms: details.bedrooms,
              squareMeters: details.squareMeters,
            },
            update: {
              amenities: details.amenities,
              bedrooms: details.bedrooms,
              squareMeters: details.squareMeters,
            },
          },
        },
      };
    case BookableObjectType.gazebo:
      return {
        gazebo: {
          upsert: {
            create: { amenities: details.amenities },
            update: { amenities: details.amenities },
          },
        },
      };
    case BookableObjectType.banquet_hall:
      return {
        banquetHall: {
          upsert: {
            create: { maxTables: details.maxTables },
            update: { maxTables: details.maxTables },
          },
        },
      };
    case BookableObjectType.outdoor_venue:
      return {
        outdoorVenue: {
          upsert: {
            create: {},
            update: {},
          },
        },
      };
    case BookableObjectType.karaoke_bar:
      return {
        karaokeBar: {
          upsert: {
            create: { tablesAmount: details.tablesAmount },
            update: { tablesAmount: details.tablesAmount },
          },
        },
      };
  }
};

const clearOtherSubtypeRelations = async (
  tx: Prisma.TransactionClient,
  type: BookableObjectType,
  bookableObjectId: number,
) => {
  const operations: Promise<unknown>[] = [];

  if (type !== BookableObjectType.cottage) {
    operations.push(tx.cottage.deleteMany({ where: { bookableObjectId } }));
  }
  if (type !== BookableObjectType.gazebo) {
    operations.push(tx.gazebo.deleteMany({ where: { bookableObjectId } }));
  }
  if (type !== BookableObjectType.banquet_hall) {
    operations.push(tx.banquetHall.deleteMany({ where: { bookableObjectId } }));
  }
  if (type !== BookableObjectType.outdoor_venue) {
    operations.push(tx.outdoorVenue.deleteMany({ where: { bookableObjectId } }));
  }
  if (type !== BookableObjectType.karaoke_bar) {
    operations.push(tx.karaokeBar.deleteMany({ where: { bookableObjectId } }));
  }

  await Promise.all(operations);
};

const mapSubtypeDetails = (
  object: BookableObjectWithRelations,
): Cottage | Gazebo | BanquetHall | OutdoorVenue | KaraokeBar | null => {
  switch (object.type) {
    case BookableObjectType.cottage:
      return object.cottage;
    case BookableObjectType.gazebo:
      return object.gazebo;
    case BookableObjectType.banquet_hall:
      return object.banquetHall;
    case BookableObjectType.outdoor_venue:
      return object.outdoorVenue;
    case BookableObjectType.karaoke_bar:
      return object.karaokeBar;
  }
};

const formatBookableObject = (object: BookableObjectWithRelations) => ({
  bookableObjectId: object.bookableObjectId,
  name: object.name,
  capacity: object.capacity,
  basePrice: Number(object.basePrice),
  isSeasonal: object.isSeasonal,
  seasonStart: object.seasonStart,
  seasonEnd: object.seasonEnd,
  description: object.description,
  isActive: object.isActive,
  type: object.type,
  details: mapSubtypeDetails(object),
  menuItems: object.objectMenuItems.map((item) => ({
    menuItemId: item.menuItemId,
    isAvailable: item.isAvailable,
    menuItem: {
      menuItemId: item.menuItem.menuItemId,
      name: item.menuItem.name,
      price: Number(item.menuItem.price),
      description: item.menuItem.description,
      isAvailable: item.menuItem.isAvailable,
      category: item.menuItem.category,
    },
  })),
});

export const bookableObjectService = {
  async listBookableObjects(query: ListBookableObjectsQuery) {
    const objects = await bookableObjectRepository.findMany({
      ...(query.type ? { type: query.type } : {}),
      ...(typeof query.isActive === "boolean" ? { isActive: query.isActive } : {}),
    });

    return objects.map(formatBookableObject);
  },

  async getBookableObjectById(bookableObjectId: number) {
    const object = await bookableObjectRepository.findById(bookableObjectId);
    if (!object) {
      throw new AppError("Bookable object not found", 404);
    }

    return formatBookableObject(object);
  },

  async createBookableObject(data: CreateBookableObjectInput) {
    const created = await bookableObjectRepository.create({
      name: data.name,
      capacity: data.capacity,
      basePrice: data.basePrice,
      isSeasonal: data.isSeasonal,
      seasonStart: data.seasonStart ? new Date(data.seasonStart) : null,
      seasonEnd: data.seasonEnd ? new Date(data.seasonEnd) : null,
      description: data.description,
      isActive: data.isActive ?? true,
      type: data.type,
      ...buildSubtypeCreateData(data.type, data.details),
    });

    return formatBookableObject(created);
  },

  async updateBookableObject(bookableObjectId: number, data: UpdateBookableObjectInput) {
    const existing = await bookableObjectRepository.findBaseById(bookableObjectId);
    if (!existing) {
      throw new AppError("Bookable object not found", 404);
    }

    const nextType = data.type ?? existing.type;
    const nextIsSeasonal = data.isSeasonal ?? existing.isSeasonal;
    const nextSeasonStart =
      data.seasonStart !== undefined ? data.seasonStart : existing.seasonStart?.toISOString();
    const nextSeasonEnd =
      data.seasonEnd !== undefined ? data.seasonEnd : existing.seasonEnd?.toISOString();

    if (nextIsSeasonal && (!nextSeasonStart || !nextSeasonEnd)) {
      throw new AppError("Season start date is required when the object is seasonal", 400);
    }

    const updated = await bookableObjectRepository.runInTransaction(async (tx) => {
      if (nextType !== existing.type) {
        await clearOtherSubtypeRelations(tx, nextType, bookableObjectId);
      }

      await tx.bookableObject.update({
        where: { bookableObjectId },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
          ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
          ...(data.isSeasonal !== undefined ? { isSeasonal: data.isSeasonal } : {}),
          ...(data.seasonStart !== undefined
            ? { seasonStart: data.seasonStart ? new Date(data.seasonStart) : null }
            : {}),
          ...(data.seasonEnd !== undefined
            ? { seasonEnd: data.seasonEnd ? new Date(data.seasonEnd) : null }
            : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...buildSubtypeUpdateOperations(nextType, data.details),
        },
      });

      return tx.bookableObject.findUniqueOrThrow({
        where: { bookableObjectId },
        include: bookableObjectInclude,
      });
    });

    return formatBookableObject(updated);
  },

  async deleteBookableObject(bookableObjectId: number) {
    const existing = await bookableObjectRepository.findBaseById(bookableObjectId);
    if (!existing) {
      throw new AppError("Bookable object not found", 404);
    }

    return bookableObjectRepository.delete(bookableObjectId);
  },
};
