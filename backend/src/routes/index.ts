import { Router } from "express";
import customerRoutes from "../modules/customer/customer.routes";
// import reservationRoutes from '../modules/reservation/reservation.routes';
// ... другие модули

const router = Router();

router.use("/customers", customerRoutes);
// router.use('/reservations', reservationRoutes);

export default router;
