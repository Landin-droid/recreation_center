// ✅ Баррель-экспорт для удобного импорта всего модуля
export { customerController } from "./customer.controller";
export { customerService } from "./customer.service";
export { customerRepository } from "./customer.repository";
export {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "./customer.validation";
export type { CustomerResponse } from "./customer.types";
