import { Router } from "express";
import bookableObjectRoutes from "../modules/bookable-object/bookable-object.routes";
import userRoutes from "../modules/user/user.routes";
import menuRoutes from "../modules/menu/menu.routes";
import rentalRoutes from "../modules/rental/rental.routes";
import reservationRoutes from "../modules/reservation/reservation.routes";
import { paymentRouter } from "../modules/payment/payment.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/bookable-objects", bookableObjectRoutes);
router.use("/menu", menuRoutes);
router.use("/reservations", reservationRoutes);
router.use("/rentals", rentalRoutes);
router.use("/payments", paymentRouter);

export default router;
