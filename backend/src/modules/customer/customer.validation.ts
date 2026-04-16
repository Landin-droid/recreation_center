import { z } from "zod";

export const createCustomerSchema = z.object({
  fullName: z.string().min(2, "FullName must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, "Invalid phone number")
    .optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().min(2, "FullName must be at least 2 characters long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, "Invalid phone number")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
