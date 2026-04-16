import { Router } from "express";
import { billingController } from "./billing.controller";

const router = Router();

router.get("/invoices", billingController.listInvoices);
router.get("/invoices/:id", billingController.getInvoiceById);
router.post("/invoices", billingController.createInvoice);
router.put("/invoices/:id", billingController.updateInvoice);
router.delete("/invoices/:id", billingController.deleteInvoice);
router.get("/payments", billingController.listPayments);
router.get("/payments/:id", billingController.getPaymentById);
router.post("/payments", billingController.createPayment);
router.put("/payments/:id", billingController.updatePayment);
router.delete("/payments/:id", billingController.deletePayment);

export default router;
