// ✅ Баррель-экспорт для удобного импорта всего модуля
export { default as userRouter } from "./user.routes";
export { userService } from "./user.service";
export { userRepository } from "./user.repository";
export {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type LoginInput,
} from "./user.validation";
export type {
  UserResponse,
  UserInternal,
  UserCreateData,
  UserUpdateData,
} from "./user.types";
