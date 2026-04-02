import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { createCustomerSchema, updateCustomerSchema, loginSchema } from './customer.validation';
import { CustomerResponse } from './customer.types';
import jwt from "jsonwebtoken";

// ✅ Тип для параметров маршрута
interface CustomerParams {
  id: string;
}

// ✅ Helper для форматирования ответа
const formatCustomerResponse = (customer: {
  customerId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: Date;
}): CustomerResponse => ({
  customerId: customer.customerId,
  fullName: customer.fullName,
  email: customer.email,
  phoneNumber: customer.phoneNumber,
  registrationDate: customer.registrationDate,
});

export const customerController = {
  // ✅ register: создание нового клиента
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createCustomerSchema.parse(req.body);
      const customer = await customerService.registerCustomer(validated);

      // ✅ Генерируем JWT токен после регистрации
      const token = jwt.sign(
        { customerId: customer.customerId, email: customer.email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" },
      );

      // ✅ Добавлен ключ "data:"
      res.status(201).json({
        success: true,
        data: {
          ...formatCustomerResponse(customer),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ✅ Логин
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = loginSchema.parse(req.body);
      const customer = await customerService.verifyPassword(
        validated.email,
        validated.password
      );
      
      const token = jwt.sign(
        { customerId: customer.customerId, email: customer.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        data: {
          ...formatCustomerResponse(customer),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ✅ Получение профиля (требуется авторизация)
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ✅ customerId уже есть в req.user после middleware авторизации
      const customer = await customerService.getCustomerById(
        (req as any).user.customerId
      );
      
      res.json({
        success: true,
        data: {
          ...formatCustomerResponse(customer),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ✅ getById: получение клиента по ID
  getById: async (
    req: Request<CustomerParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный ID клиента',
        });
      }

      const customer = await customerService.getCustomerById(parseInt(id));
      
      // ✅ Добавлен ключ "data:"
      res.json({ 
        success: true, 
        data: {
          ...formatCustomerResponse(customer),
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  // ✅ update: обновление клиента
  update: async (
    req: Request<CustomerParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный ID клиента',
        });
      }
      
      const validated = updateCustomerSchema.parse(req.body);
      
      const customer = await customerService.updateCustomer(
        parseInt(id),
        validated
      );
      
      // ✅ Добавлен ключ "data:"
      res.json({
        success: true,
        data: {
          ...formatCustomerResponse(customer),
        },
      });
    } catch (error) {
      next(error);
    }
  },
  
  // ✅ delete: удаление клиента
  delete: async (
    req: Request<CustomerParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный ID клиента',
        });
      }
      
      await customerService.deleteCustomer(parseInt(id));
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};