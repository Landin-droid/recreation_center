import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().default("5000"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),

  // ЮKassa configuration
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_API_KEY: z.string().optional(),
  YOOKASSA_WEBHOOK_SECRET: z.string().optional(),

  // Payment configuration
  PAYMENT_SUCCESS_REDIRECT: z
    .string()
    .default("http://localhost:3000/payment/success"),
  PAYMENT_FAILURE_REDIRECT: z
    .string()
    .default("http://localhost:3000/payment/failure"),
  PAYMENT_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(15),
});

export const env = envSchema.parse(process.env);
export const jwtSecret: string = env.JWT_SECRET;
