import { Router } from "express";
import { customerController } from "./customer.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

// ✅ Публичные маршруты
router.post("/register", customerController.register);
router.post("/login", customerController.login);
router.get("/profile", authenticate, customerController.getProfile);

// ✅ Маршруты с параметром ID
router.get("/:id", customerController.getById);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.delete);

export default router;
