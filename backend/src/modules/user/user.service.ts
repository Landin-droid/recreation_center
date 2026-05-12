import { Prisma } from "../../generated/prisma/client";
import bcrypt from "bcryptjs";
import { AppError } from "../../middleware/errorHandler";
import { UserRepository, userRepository } from "./user.repository";
import { CreateUserInput, UpdateUserInput } from "./user.validation";
import { UserInternal, UserResponse } from "./user.types";

const toUserResponse = (user: UserInternal): UserResponse => ({
  userId: user.userId,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  registrationDate: user.registrationDate,
  role: user.role,
});

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async listUsers() {
    const users = await this.userRepository.findMany();
    return users.map(toUserResponse);
  }

  async registerUser(data: CreateUserInput) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email is already in use", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const prismaData: Prisma.UserCreateInput = {
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: "user",
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
    };

    const user = await this.userRepository.create(prismaData);
    return toUserResponse(user);
  }

  async verifyPassword(email: string, password: string) {
    const user = (await this.userRepository.findByEmail(
      email,
    )) as UserInternal | null;

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }

    return toUserResponse(user);
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return toUserResponse(user);
  }

  async updateUser(id: number, data: UpdateUserInput) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await this.userRepository.findByEmail(data.email);
      if (emailExists) {
        throw new AppError("Email is already in use", 409);
      }
    }

    const prismaData: Prisma.UserUpdateInput = {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phoneNumber !== undefined
        ? { phoneNumber: data.phoneNumber }
        : {}),
    };

    const updated = await this.userRepository.update(id, prismaData);
    return toUserResponse(updated);
  }

  async deleteUser(id: number) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    return this.userRepository.delete(id);
  }
}

export const userService = new UserService(userRepository);
