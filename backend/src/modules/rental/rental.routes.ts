import { Router } from "express";
import { rentalController } from "./rental.controller";

const router = Router();

router.get("/items", rentalController.listItems);
router.get("/items/:id", rentalController.getItemById);
router.post("/items", rentalController.createItem);
router.put("/items/:id", rentalController.updateItem);
router.delete("/items/:id", rentalController.deleteItem);
router.get("/price-rules", rentalController.listPriceRules);
router.post("/price-rules", rentalController.createPriceRule);
router.put("/price-rules/:id", rentalController.updatePriceRule);
router.delete("/price-rules/:id", rentalController.deletePriceRule);

export default router;
