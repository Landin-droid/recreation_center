import { MENU_SUPPORTED_OBJECT_TYPES } from "../../common/constants";
import { AppError } from "../../middleware/errorHandler";
import { menuRepository, MenuItemWithRelations } from "./menu.repository";
import {
  CreateMenuItemInput,
  ListMenuAssignmentsQuery,
  MenuAssignmentInput,
  UpdateMenuItemInput,
} from "./menu.validation";

const formatMenuItem = (item: MenuItemWithRelations) => ({
  menuItemId: item.menuItemId,
  name: item.name,
  price: Number(item.price),
  description: item.description,
  isAvailable: item.isAvailable,
  category: item.category,
  availableIn: item.objectMenuItems.map((entry) => ({
    bookableObjectId: entry.bookableObjectId,
    objectName: entry.bookableObject.name,
    objectType: entry.bookableObject.type,
    isAvailable: entry.isAvailable,
  })),
});

const ensureMenuAssignmentContext = async (bookableObjectId: number, menuItemId: number) => {
  const object = await menuRepository.findBookableObjectById(bookableObjectId);
  if (!object) {
    throw new AppError("Bookable object not found", 404);
  }

  if (!MENU_SUPPORTED_OBJECT_TYPES.includes(object.type)) {
    throw new AppError("The selected bookable object does not support menu items", 400);
  }

  const menuItem = await menuRepository.findMenuItemBaseById(menuItemId);
  if (!menuItem) {
    throw new AppError("Menu item not found", 404);
  }

  return { object, menuItem };
};

export const menuService = {
  async listMenuItems() {
    const items = await menuRepository.findMenuItems();
    return items.map(formatMenuItem);
  },

  async getMenuItemById(menuItemId: number) {
    const item = await menuRepository.findMenuItemById(menuItemId);
    if (!item) {
      throw new AppError("Menu item not found", 404);
    }

    return formatMenuItem(item);
  },

  async createMenuItem(data: CreateMenuItemInput) {
    const item = await menuRepository.createMenuItem({
      name: data.name,
      price: data.price,
      description: data.description,
      isAvailable: data.isAvailable ?? true,
      category: data.category ?? null,
    });

    return formatMenuItem(item);
  },

  async updateMenuItem(menuItemId: number, data: UpdateMenuItemInput) {
    const existing = await menuRepository.findMenuItemBaseById(menuItemId);
    if (!existing) {
      throw new AppError("Menu item not found", 404);
    }

    const item = await menuRepository.updateMenuItem(menuItemId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
    });

    return formatMenuItem(item);
  },

  async deleteMenuItem(menuItemId: number) {
    const existing = await menuRepository.findMenuItemBaseById(menuItemId);
    if (!existing) {
      throw new AppError("Menu item not found", 404);
    }

    return menuRepository.deleteMenuItem(menuItemId);
  },

  async listAssignments(query: ListMenuAssignmentsQuery) {
    const assignments = await menuRepository.findAssignments({
      ...(query.bookableObjectId ? { bookableObjectId: query.bookableObjectId } : {}),
    });

    return assignments.map((assignment) => ({
      bookableObjectId: assignment.bookableObjectId,
      menuItemId: assignment.menuItemId,
      isAvailable: assignment.isAvailable,
      bookableObject: {
        bookableObjectId: assignment.bookableObject.bookableObjectId,
        name: assignment.bookableObject.name,
        type: assignment.bookableObject.type,
      },
      menuItem: {
        menuItemId: assignment.menuItem.menuItemId,
        name: assignment.menuItem.name,
        price: Number(assignment.menuItem.price),
      },
    }));
  },

  async upsertAssignment(data: MenuAssignmentInput) {
    await ensureMenuAssignmentContext(data.bookableObjectId, data.menuItemId);

    const assignment = await menuRepository.upsertAssignment({
      bookableObjectId: data.bookableObjectId,
      menuItemId: data.menuItemId,
      isAvailable: data.isAvailable ?? true,
    });

    return {
      bookableObjectId: assignment.bookableObjectId,
      menuItemId: assignment.menuItemId,
      isAvailable: assignment.isAvailable,
      bookableObject: {
        name: assignment.bookableObject.name,
        type: assignment.bookableObject.type,
      },
      menuItem: {
        name: assignment.menuItem.name,
        price: Number(assignment.menuItem.price),
      },
    };
  },

  async deleteAssignment(bookableObjectId: number, menuItemId: number) {
    const existingAssignment = await menuRepository.findAssignmentByIds(bookableObjectId, menuItemId);
    if (!existingAssignment) {
      throw new AppError("Menu assignment not found", 404);
    }

    return menuRepository.deleteAssignment(bookableObjectId, menuItemId);
  },
};
