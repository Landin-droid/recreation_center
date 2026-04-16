import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { customerController } from "./customer.controller";

const router = Router();

router.get("/", customerController.list);
router.post("/register", customerController.register);
router.post("/login", customerController.login);
router.post("/refresh", customerController.refresh);
router.get("/profile", authenticate, customerController.getProfile);
router.get("/:id", customerController.getById);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.delete);

export default router;
