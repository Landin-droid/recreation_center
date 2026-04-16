import { Router } from "express";
import billingRoutes from "../modules/billing/billing.routes";
import bookableObjectRoutes from "../modules/bookable-object/bookable-object.routes";
import userRoutes from "../modules/user/user.routes";
import menuRoutes from "../modules/menu/menu.routes";
import rentalRoutes from "../modules/rental/rental.routes";
import reservationRoutes from "../modules/reservation/reservation.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/bookable-objects", bookableObjectRoutes);
router.use("/menu", menuRoutes);
router.use("/reservations", reservationRoutes);
router.use("/billing", billingRoutes);
router.use("/rentals", rentalRoutes);

export default router;
