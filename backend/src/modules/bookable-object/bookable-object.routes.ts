import { Router } from "express";
import { bookableObjectController } from "./bookable-object.controller";

const router = Router();

router.get("/", bookableObjectController.list);
router.get("/:id", bookableObjectController.getById);
router.post("/", bookableObjectController.create);
router.put("/:id", bookableObjectController.update);
router.delete("/:id", bookableObjectController.delete);

export default router;
