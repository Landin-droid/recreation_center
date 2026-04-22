import { User } from "../../generated/prisma/client";

export type UserInternal = User;

// ✅ Экспортируем готовый тип для использования в контроллерах
export type UserResponse = {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: Date;
  role: string;
};

// ✅ Тип для создания (совпадает с Zod infer, но можно расширить)
export type UserCreateData = {
  fullName: string;
  email: string;
  phoneNumber?: string;
};

// ✅ Тип для обновления (все поля опциональны)
export type UserUpdateData = Partial<{
  fullName: string;
  email: string;
  phoneNumber: string;
}>;
