import { Router } from "express";
import { reservationController } from "./reservation.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.get("/", authenticate, reservationController.list);
router.get("/:id", authenticate, reservationController.getById);
router.post("/", authenticate, reservationController.create);
router.put("/:id", authenticate, reservationController.update);
router.delete("/:id", authenticate, reservationController.delete);

// Инициировать платёж для бронирования
router.post(
  "/:id/payment/initiate",
  authenticate,
  reservationController.initiatePayment,
);

export default router;
