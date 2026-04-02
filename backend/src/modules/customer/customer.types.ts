import { Customer } from "@prisma/client";

export type CustomerInternal = Customer;

// ✅ Экспортируем готовый тип для использования в контроллерах
export type CustomerResponse = {
  customerId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: Date;
};

// ✅ Тип для создания (совпадает с Zod infer, но можно расширить)
export type CustomerCreateData = {
  fullName: string;
  email: string;
  phoneNumber?: string;
};

// ✅ Тип для обновления (все поля опциональны)
export type CustomerUpdateData = Partial<{
  fullName: string;
  email: string;
  phoneNumber: string;
}>;
