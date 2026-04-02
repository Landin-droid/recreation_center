import { z } from "zod";

export const createCustomerSchema = z.object({
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Неверный формат email"),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
    .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, "Неверный формат телефона")
    .optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, "Неверный формат телефона")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Пароль обязателен"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
