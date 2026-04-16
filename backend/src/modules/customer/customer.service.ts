import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { AppError } from "../../middleware/errorHandler";
import { jwtSecret } from "../../config/env";
import { customerRepository } from "./customer.repository";
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./customer.validation";
import { CustomerInternal, CustomerResponse } from "./customer.types";

const toCustomerResponse = (customer: CustomerInternal): CustomerResponse => ({
  customerId: customer.customerId,
  fullName: customer.fullName,
  email: customer.email,
  phoneNumber: customer.phoneNumber,
  registrationDate: customer.registrationDate,
});

// ✅ Вспомогательные функции для работы с токенами
const generateRefreshTokenString = (): string => {
  return randomBytes(32).toString("hex");
};

const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

const generateAuthTokens = (
  customerId: number,
  email: string,
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ customerId, email }, jwtSecret, {
    expiresIn: "15m",
  });
  const refreshToken = generateRefreshTokenString();
  return { accessToken, refreshToken };
};

export const customerService = {
  async listCustomers() {
    const customers = await customerRepository.findMany();
    return customers.map(toCustomerResponse);
  },

  async registerCustomer(data: CreateCustomerInput) {
    const existing = await customerRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email is already in use", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const prismaData: Prisma.CustomerCreateInput = {
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
    };

    const customer = await customerRepository.create(prismaData);
    return toCustomerResponse(customer);
  },

  async verifyPassword(email: string, password: string) {
    const customer = (await customerRepository.findByEmail(
      email,
    )) as CustomerInternal | null;

    if (!customer) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }

    return toCustomerResponse(customer);
  },

  async getCustomerById(id: number) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    return toCustomerResponse(customer);
  },

  async updateCustomer(id: number, data: UpdateCustomerInput) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError("Customer not found", 404);
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await customerRepository.findByEmail(data.email);
      if (emailExists) {
        throw new AppError("Email is already in use", 409);
      }
    }

    const prismaData: Prisma.CustomerUpdateInput = {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phoneNumber !== undefined
        ? { phoneNumber: data.phoneNumber }
        : {}),
    };

    const updated = await customerRepository.update(id, prismaData);
    return toCustomerResponse(updated);
  },

  async deleteCustomer(id: number) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError("Customer not found", 404);
    }

    return customerRepository.delete(id);
  },

  // ✅ Методы для работы с Refresh Token
  async createAuthTokens(customerId: number, email: string) {
    const { accessToken, refreshToken } = generateAuthTokens(customerId, email);

    // Сохранить хеш refresh token в БД (на 7 дней)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await customerRepository.storeRefreshToken(
      customerId,
      refreshTokenHash,
      expiresAt,
    );

    return { accessToken, refreshToken };
  },

  async validateRefreshToken(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken =
      await customerRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new AppError("Refresh token not found", 401);
    }

    // Проверить, что токен не отозван
    if (storedToken.revokedAt) {
      throw new AppError("Refresh token has been revoked", 401);
    }

    // Проверить срок действия
    if (new Date() > storedToken.expiresAt) {
      throw new AppError("Refresh token has expired", 401);
    }

    return storedToken.customer;
  },

  async refreshTokens(refreshToken: string) {
    const customer = await this.validateRefreshToken(refreshToken);

    // Отозвать старый токен
    const oldTokenHash = hashRefreshToken(refreshToken);
    await customerRepository.revokeRefreshToken(oldTokenHash);

    // Создать новую пару
    return this.createAuthTokens(customer.customerId, customer.email);
  },
};
