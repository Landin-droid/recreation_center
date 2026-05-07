import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { paymentController } from "./payment.controller";

export const paymentRouter = Router();
export const refundRouter = Router();
export const yookassaWebhookRouter = Router();

paymentRouter.post("/webhook", paymentController.paymentWebhook);
paymentRouter.post("/", authenticate, paymentController.createPayment);
paymentRouter.get("/:paymentId", authenticate, paymentController.getPayment);
paymentRouter.patch(
  "/:paymentId",
  authenticate,
  paymentController.refreshPayment,
);

refundRouter.post("/webhook", paymentController.refundWebhook);
refundRouter.post("/", authenticate, paymentController.createRefund);
refundRouter.get("/:refundId", authenticate, paymentController.getRefund);

yookassaWebhookRouter.post("/", paymentController.yookassaWebhook);

export default paymentRouter;
