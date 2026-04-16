import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { jwtSecret } from "../../config/env";
import { customerService } from "./customer.service";
import {
  createCustomerSchema,
  loginSchema,
  updateCustomerSchema,
} from "./customer.validation";

const formatCustomerResponse = (customer: {
  customerId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: Date;
}) => ({
  customerId: customer.customerId,
  fullName: customer.fullName,
  email: customer.email,
  phoneNumber: customer.phoneNumber,
  registrationDate: customer.registrationDate,
});

export const customerController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const customers = await customerService.listCustomers();
    res.json({ success: true, data: customers.map(formatCustomerResponse) });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const validated = createCustomerSchema.parse(req.body);
    const customer = await customerService.registerCustomer(validated);

    const { accessToken, refreshToken } =
      await customerService.createAuthTokens(
        customer.customerId,
        customer.email,
      );

    res.status(201).json({
      success: true,
      data: {
        ...formatCustomerResponse(customer),
        accessToken,
        refreshToken,
      },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const validated = loginSchema.parse(req.body);
    const customer = await customerService.verifyPassword(
      validated.email,
      validated.password,
    );

    const { accessToken, refreshToken } =
      await customerService.createAuthTokens(
        customer.customerId,
        customer.email,
      );

    res.json({
      success: true,
      data: {
        ...formatCustomerResponse(customer),
        accessToken,
        refreshToken,
      },
    });
  }),

  // ✅ Обновить токены используя refresh token
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await customerService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.getCustomerById(
      req.user!.customerId,
    );
    res.json({ success: true, data: formatCustomerResponse(customer) });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "customer");
    const customer = await customerService.getCustomerById(id);
    res.json({ success: true, data: formatCustomerResponse(customer) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "customer");
    const validated = updateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(id, validated);
    res.json({ success: true, data: formatCustomerResponse(customer) });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "customer");
    await customerService.deleteCustomer(id);
    res.status(204).send();
  }),
};
