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

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isPublicImagePath = (value: string) =>
  /^\/images\/(?!.*(?:^|\/)\.\.(?:\/|$))[\p{L}\p{N}._~!$&'()*+,;=:@%/-]+\.(?:avif|gif|jpe?g|png|webp)$/iu.test(
    value,
  );

export const imageUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => isHttpUrl(value) || isPublicImagePath(value),
    "Значение должно быть http(s) URL или путем к изображению из /images",
  );
