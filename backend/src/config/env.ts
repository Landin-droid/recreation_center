import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().default("5000"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET должен быть не менее 32 символов"),
});

export const env = envSchema.parse(process.env);

export const jwtSecret: string = env.JWT_SECRET;