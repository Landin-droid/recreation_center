import { z } from "zod";

export const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Некорректный формат даты");

export const optionalDateStringSchema = dateStringSchema.optional().nullable();

export const decimalSchema = z.coerce
  .number()
  .finite("Значение должно быть числом")
  .nonnegative("Значение не может быть отрицательным");

export const positiveDecimalSchema = z.coerce
  .number()
  .finite("Значение должно быть числом")
  .positive("Значение должно быть больше нуля");

export const positiveIntSchema = z.coerce
  .number()
  .int("Значение должно быть целым числом")
  .positive("Значение должно быть больше нуля");
