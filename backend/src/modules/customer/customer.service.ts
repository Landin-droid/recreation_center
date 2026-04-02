import { AppError } from "../../middleware/errorHandler";
import { customerRepository } from "./customer.repository";
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  LoginInput,
} from "./customer.validation";
import { CustomerInternal, CustomerResponse } from "./customer.types";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const toCustomerResponse = (customer: CustomerInternal): CustomerResponse => ({
  customerId: customer.customerId,
  fullName: customer.fullName,
  email: customer.email,
  phoneNumber: customer.phoneNumber,
  registrationDate: customer.registrationDate,
});

export const customerService = {
  async registerCustomer(data: CreateCustomerInput) {
    // Проверка на дубликат email
    const existing = await customerRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email уже зарегистрирован", 409);
    }

    // Хеширование пароля
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(data.password, saltRounds);

    const prismaData: Prisma.CustomerCreateInput = {
      fullName: data.fullName,
      email: data.email,
      password_hash, // ✅ Сохраняем хеш
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    };

    const customer = await customerRepository.create(prismaData);

    // ✅ Возвращаем публичный тип (без passwordHash)
    return toCustomerResponse(customer);
  },

  // ✅ Проверка пароля при логине
  async verifyPassword(email: string, password: string) {
    // Используем внутренний тип для доступа к passwordHash
    const customer = (await customerRepository.findByEmail(
      email,
    )) as CustomerInternal | null;

    if (!customer) {
      throw new AppError("Неверный email или пароль", 401);
    }

    const isValid = await bcrypt.compare(password, customer.password_hash);
    if (!isValid) {
      throw new AppError("Неверный email или пароль", 401);
    }

    // ✅ Возвращаем публичный тип (без passwordHash)
    return toCustomerResponse(customer);
  },

  // ✅ getCustomerById: возвращает Customer или выбрасывает ошибку
  async getCustomerById(id: number) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new AppError("Клиент не найден", 404);
    }
    return toCustomerResponse(customer);
  },

  // ✅ updateCustomer: обновление с валидацией
  async updateCustomer(id: number, data: UpdateCustomerInput) {
    // Проверка существования клиента
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError("Клиент не найден", 404);
    }

    // Проверка на уникальность email при обновлении
    if (data.email && data.email !== existing.email) {
      const emailExists = await customerRepository.findByEmail(data.email);
      if (emailExists) {
        throw new AppError("Email уже зарегистрирован", 409);
      }
    }

    // ✅ Преобразование в Prisma-тип
    const prismaData: Prisma.CustomerUpdateInput = {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.email && { email: data.email }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
    };

    return customerRepository.update(id, prismaData);
  },

  // ✅ deleteCustomer: удаление с проверкой
  async deleteCustomer(id: number) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError("Клиент не найден", 404);
    }

    // Проверка: нельзя удалить клиента с активными бронированиями
    // (опционально, зависит от бизнес-логики)

    return customerRepository.delete(id);
  },
};
