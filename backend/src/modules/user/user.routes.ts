import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { userController } from "./user.controller";

const router = Router();

router.get("/", userController.list);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/refresh", userController.refresh);
router.get("/profile", authenticate, userController.getProfile);
router.get("/:id", userController.getById);
router.put("/:id", userController.update);
router.delete("/:id", userController.delete);

export default router;
