import express from "express";
import {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  restoreMaterial,
} from "../controllers/materialControllers.js";
import {
  createMaterialValidator,
  updateMaterialValidator,
  materialIdValidator,
} from "../middlewares/validators/materialValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

/**
 * Material Routes
 *
 * CRITICAL: All routes are protected and require authentication
 * CRITICAL: Authorization based on role and scope
 * CRITICAL: Department scoping (materials belong to departments)
 */

const router = express.Router();

router.get("/", verifyJWT, authorize("Material", "read"), getMaterials);
router.get(
  "/:resourceId",
  verifyJWT,
  materialIdValidator,
  authorize("Material", "read"),
  getMaterial
);
router.post(
  "/",
  verifyJWT,
  createMaterialValidator,
  authorize("Material", "create"),
  createMaterial
);
router.put(
  "/:resourceId",
  verifyJWT,
  materialIdValidator,
  updateMaterialValidator,
  authorize("Material", "update"),
  updateMaterial
);
router.delete(
  "/:resourceId",
  verifyJWT,
  materialIdValidator,
  authorize("Material", "delete"),
  deleteMaterial
);
router.patch(
  "/:resourceId/restore",
  verifyJWT,
  materialIdValidator,
  authorize("Material", "update"),
  restoreMaterial
);

export default router;
