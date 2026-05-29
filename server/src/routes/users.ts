import { Router } from "express";
import {
    createUserController,
    deleteOwnAccountController,
    getCurrentUserProfileController,
    updateOwnProfileController,
    updateUserOrganizationController
} from "../controllers/users.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", createUserController);

router.get("/me", requireAuth, getCurrentUserProfileController);
router.patch("/me", requireAuth, updateOwnProfileController);
router.delete("/me", requireAuth, deleteOwnAccountController);
router.patch("/me/organization", requireAuth, updateUserOrganizationController);

export default router;
