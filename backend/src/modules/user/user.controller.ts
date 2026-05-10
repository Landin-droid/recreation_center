import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { userService } from "./user.service";
import { updateUserSchema } from "./user.validation";

const formatUserResponse = (user: {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: Date;
  role: string;
}) => ({
  userId: user.userId,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  registrationDate: user.registrationDate,
  role: user.role,
});

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.listUsers();
    res.json({ success: true, data: users.map(formatUserResponse) });
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.user!.userId);
    res.json({ success: true, data: formatUserResponse(user) });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "user");
    const user = await userService.getUserById(id);
    res.json({ success: true, data: formatUserResponse(user) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "user");
    const validated = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(id, validated);
    res.json({ success: true, data: formatUserResponse(user) });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "user");
    await userService.deleteUser(id);
    res.status(204).send();
  }),
};
