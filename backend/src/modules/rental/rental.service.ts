import { RentalCategory } from "../../generated/prisma/client";
import { AppError } from "../../middleware/errorHandler";
import {
  CreateRentalItemInput,
  CreateRentalPriceRuleInput,
  ListRentalPriceRulesQuery,
  UpdateRentalItemInput,
  UpdateRentalPriceRuleInput,
} from "./rental.validation";
import { rentalRepository, RentalItemWithRelations } from "./rental.repository";

const formatRentalItem = (item: RentalItemWithRelations) => ({
  rentalItemId: item.rentalItemId,
  name: item.name,
  description: item.description,
  pricePerHour: item.pricePerHour === null ? null : Number(item.pricePerHour),
  isSeasonal: item.isSeasonal,
  maxCapacity: item.maxCapacity,
  imageUrl: item.imageUrl,
  isActive: item.isActive,
  category: item.category,
  seasonType: item.seasonType,
  priceRules: item.priceRules.map((rule) => ({
    ruleId: rule.ruleId,
    pricePerKm: Number(rule.pricePerKm),
    minKm: rule.minKm,
    maxKm: rule.maxKm,
    passengerType: rule.passengerType,
  })),
});

const ensureSnowmobileRental = async (rentalItemId: number) => {
  const rentalItem = await rentalRepository.findRentalItemBaseById(rentalItemId);
  if (!rentalItem) {
    throw new AppError("Rental item not found", 404);
  }

  if (rentalItem.category !== RentalCategory.snowmobile) {
    throw new AppError("The selected rental item does not support snowmobile rentals", 400);
  }

  return rentalItem;
};

const validateKmRange = (minKm: number, maxKm: number | null | undefined) => {
  if (maxKm !== null && maxKm !== undefined && maxKm < minKm) {
    throw new AppError("maxKm must be greater than or equal to minKm", 400);
  }
};

export const rentalService = {
  async listRentalItems() {
    const items = await rentalRepository.findRentalItems();
    return items.map(formatRentalItem);
  },

  async getRentalItemById(rentalItemId: number) {
    const item = await rentalRepository.findRentalItemById(rentalItemId);
    if (!item) {
      throw new AppError("Rental item not found", 404);
    }

    return formatRentalItem(item);
  },

  async createRentalItem(data: CreateRentalItemInput) {
    const item = await rentalRepository.createRentalItem({
      name: data.name,
      description: data.description,
      pricePerHour: data.pricePerHour ?? null,
      isSeasonal: data.isSeasonal ?? false,
      maxCapacity: data.maxCapacity ?? null,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
      category: data.category,
      seasonType: data.seasonType ?? null,
    });

    return formatRentalItem(item);
  },

  async updateRentalItem(rentalItemId: number, data: UpdateRentalItemInput) {
    const existing = await rentalRepository.findRentalItemBaseById(rentalItemId);
    if (!existing) {
      throw new AppError("Rental item not found", 404);
    }

    const item = await rentalRepository.updateRentalItem(rentalItemId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.pricePerHour !== undefined ? { pricePerHour: data.pricePerHour } : {}),
      ...(data.isSeasonal !== undefined ? { isSeasonal: data.isSeasonal } : {}),
      ...(data.maxCapacity !== undefined ? { maxCapacity: data.maxCapacity } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.seasonType !== undefined ? { seasonType: data.seasonType } : {}),
    });

    return formatRentalItem(item);
  },

  async deleteRentalItem(rentalItemId: number) {
    const existing = await rentalRepository.findRentalItemBaseById(rentalItemId);
    if (!existing) {
      throw new AppError("Rental item not found", 404);
    }

    return rentalRepository.deleteRentalItem(rentalItemId);
  },

  async listPriceRules(query: ListRentalPriceRulesQuery) {
    const rules = await rentalRepository.findPriceRules({
      ...(query.rentalItemId ? { rentalItemId: query.rentalItemId } : {}),
    });

    return rules.map((rule) => ({
      ruleId: rule.ruleId,
      rentalItemId: rule.rentalItemId,
      pricePerKm: Number(rule.pricePerKm),
      minKm: rule.minKm,
      maxKm: rule.maxKm,
      passengerType: rule.passengerType,
      rentalItem: {
        name: rule.rentalItem.name,
        category: rule.rentalItem.category,
      },
    }));
  },

  async createPriceRule(data: CreateRentalPriceRuleInput) {
    await ensureSnowmobileRental(data.rentalItemId);
    validateKmRange(data.minKm ?? 1, data.maxKm);

    const rule = await rentalRepository.createPriceRule({
      rentalItem: {
        connect: { rentalItemId: data.rentalItemId },
      },
      pricePerKm: data.pricePerKm,
      minKm: data.minKm ?? 1,
      maxKm: data.maxKm ?? null,
      passengerType: data.passengerType,
    });

    return {
      ruleId: rule.ruleId,
      rentalItemId: rule.rentalItemId,
      pricePerKm: Number(rule.pricePerKm),
      minKm: rule.minKm,
      maxKm: rule.maxKm,
      passengerType: rule.passengerType,
    };
  },

  async updatePriceRule(ruleId: number, data: UpdateRentalPriceRuleInput) {
    const existing = await rentalRepository.findPriceRuleById(ruleId);
    if (!existing) {
      throw new AppError("Rental price rule not found", 404);
    }

    await ensureSnowmobileRental(data.rentalItemId ?? existing.rentalItemId);

    const nextMinKm = data.minKm ?? existing.minKm;
    const nextMaxKm = data.maxKm ?? existing.maxKm;
    validateKmRange(nextMinKm, nextMaxKm);

    const rule = await rentalRepository.updatePriceRule(ruleId, {
      ...(data.rentalItemId !== undefined
        ? { rentalItem: { connect: { rentalItemId: data.rentalItemId } } }
        : {}),
      ...(data.pricePerKm !== undefined ? { pricePerKm: data.pricePerKm } : {}),
      ...(data.minKm !== undefined ? { minKm: data.minKm } : {}),
      ...(data.maxKm !== undefined ? { maxKm: data.maxKm } : {}),
      ...(data.passengerType !== undefined ? { passengerType: data.passengerType } : {}),
    });

    return {
      ruleId: rule.ruleId,
      rentalItemId: rule.rentalItemId,
      pricePerKm: Number(rule.pricePerKm),
      minKm: rule.minKm,
      maxKm: rule.maxKm,
      passengerType: rule.passengerType,
    };
  },

  async deletePriceRule(ruleId: number) {
    const existing = await rentalRepository.findPriceRuleById(ruleId);
    if (!existing) {
      throw new AppError("Rental price rule not found", 404);
    }

    return rentalRepository.deletePriceRule(ruleId);
  },
};
