import { Router } from "express";
import { reservationController } from "./reservation.controller";

const router = Router();

router.get("/", reservationController.list);
router.get("/:id", reservationController.getById);
router.post("/", reservationController.create);
router.put("/:id", reservationController.update);
router.delete("/:id", reservationController.delete);

export default router;
