import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export const menuItemInclude = {
  objectMenuItems: {
    include: {
      bookableObject: true,
    },
  },
} satisfies Prisma.MenuItemInclude;

export type MenuItemWithRelations = Prisma.MenuItemGetPayload<{
  include: typeof menuItemInclude;
}>;

export const menuRepository = {
  findMenuItems: () =>
    prisma.menuItem.findMany({
      include: menuItemInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),

  findMenuItemById: (menuItemId: number) =>
    prisma.menuItem.findUnique({
      where: { menuItemId },
      include: menuItemInclude,
    }),

  findMenuItemBaseById: (menuItemId: number) =>
    prisma.menuItem.findUnique({
      where: { menuItemId },
    }),

  createMenuItem: (data: Prisma.MenuItemCreateInput) =>
    prisma.menuItem.create({
      data,
      include: menuItemInclude,
    }),

  updateMenuItem: (menuItemId: number, data: Prisma.MenuItemUpdateInput) =>
    prisma.menuItem.update({
      where: { menuItemId },
      data,
      include: menuItemInclude,
    }),

  deleteMenuItem: (menuItemId: number) =>
    prisma.menuItem.delete({
      where: { menuItemId },
    }),

  findBookableObjectById: (bookableObjectId: number) =>
    prisma.bookableObject.findUnique({
      where: { bookableObjectId },
    }),

  findAssignments: (where: Prisma.ObjectMenuItemWhereInput) =>
    prisma.objectMenuItem.findMany({
      where,
      include: {
        bookableObject: true,
        menuItem: true,
      },
      orderBy: [{ bookableObjectId: "asc" }, { menuItemId: "asc" }],
    }),

  findAssignmentByIds: (bookableObjectId: number, menuItemId: number) =>
    prisma.objectMenuItem.findUnique({
      where: {
        menuItemId_bookableObjectId: { bookableObjectId, menuItemId },
      },
    }),

  upsertAssignment: (data: { bookableObjectId: number; menuItemId: number; isAvailable: boolean }) =>
    prisma.objectMenuItem.upsert({
      where: {
        menuItemId_bookableObjectId: {
          bookableObjectId: data.bookableObjectId,
          menuItemId: data.menuItemId,
        },
      },
      update: { isAvailable: data.isAvailable },
      create: data,
      include: {
        bookableObject: true,
        menuItem: true,
      },
    }),

  deleteAssignment: (bookableObjectId: number, menuItemId: number) =>
    prisma.objectMenuItem.delete({
      where: {
        menuItemId_bookableObjectId: { bookableObjectId, menuItemId },
      },
    }),
};
