import { BookableObjectType } from "../../generated/prisma/client";
import { z } from "zod";
import {
  decimalSchema,
  optionalDateStringSchema,
  positiveIntSchema,
} from "../../common/validation";

export const subtypeDetailsSchema = z
  .object({
    amenities: z.string().trim().min(1).optional(),
    bedrooms: positiveIntSchema.optional(),
    squareMeters: positiveIntSchema.optional(),
    maxTables: positiveIntSchema.optional(),
    tablesAmount: positiveIntSchema.optional(),
  })
  .optional()
  .default({});

const bookableObjectBaseSchema = z.object({
  name: z.string().trim().min(2),
  capacity: positiveIntSchema,
  basePrice: decimalSchema,
  isSeasonal: z.boolean().default(false),
  seasonStart: optionalDateStringSchema,
  seasonEnd: optionalDateStringSchema,
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  type: z.nativeEnum(BookableObjectType),
  details: subtypeDetailsSchema,
});

const validateSeasonWindow = (
  data: { isSeasonal?: boolean; seasonStart?: string | null; seasonEnd?: string | null },
  ctx: z.RefinementCtx,
) => {
  if (data.isSeasonal && (!data.seasonStart || !data.seasonEnd)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seasonStart"],
      message: "Season start date is required when the object is seasonal",
    });
  }

  if (
    data.seasonStart &&
    data.seasonEnd &&
    new Date(data.seasonStart) > new Date(data.seasonEnd)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seasonEnd"],
      message: "Season end date must be after season start date",
    });
  }
};

export const createBookableObjectSchema = bookableObjectBaseSchema.superRefine(validateSeasonWindow);
export const updateBookableObjectSchema = bookableObjectBaseSchema.partial().superRefine(validateSeasonWindow);

export const listBookableObjectsQuerySchema = z.object({
  type: z.nativeEnum(BookableObjectType).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type CreateBookableObjectInput = z.infer<typeof createBookableObjectSchema>;
export type UpdateBookableObjectInput = z.infer<typeof updateBookableObjectSchema>;
export type ListBookableObjectsQuery = z.infer<typeof listBookableObjectsQuerySchema>;
