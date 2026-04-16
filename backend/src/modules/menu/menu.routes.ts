import { Router } from "express";
import { menuController } from "./menu.controller";

const router = Router();

router.get("/items", menuController.listItems);
router.get("/items/:id", menuController.getItemById);
router.post("/items", menuController.createItem);
router.put("/items/:id", menuController.updateItem);
router.delete("/items/:id", menuController.deleteItem);
router.get("/assignments", menuController.listAssignments);
router.post("/assignments", menuController.upsertAssignment);
router.delete("/assignments/:bookableObjectId/:menuItemId", menuController.deleteAssignment);

export default router;
