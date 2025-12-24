import express from "express";

import AuthRoutes from "./authRoutes.js";
import OrganizationRoutes from "./organizationRoutes.js";
import DepartmentRoutes from "./departmentRoutes.js";

const router = express.Router();

router.use("/auth", AuthRoutes);
router.use("/organizations", OrganizationRoutes);
router.use("/departments", DepartmentRoutes);

export default router;
