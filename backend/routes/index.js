import express from "express";

import AuthRoutes from "./authRoutes.js";
import OrganizationRoutes from "./organizationRoutes.js";
import DepartmentRoutes from "./departmentRoutes.js";
import UserRoutes from "./userRoutes.js";
import VendorRoutes from "./vendorRoutes.js";
import MaterialRoutes from "./materialRoutes.js";
import TaskRoutes from "./taskRoutes.js";
import TaskActivityRoutes from "./taskActivityRoutes.js";

const router = express.Router();

router.use("/auth", AuthRoutes);
router.use("/organizations", OrganizationRoutes);
router.use("/departments", DepartmentRoutes);
router.use("/users", UserRoutes);
router.use("/vendors", VendorRoutes);
router.use("/materials", MaterialRoutes);
router.use("/tasks", TaskRoutes);
router.use("/task-activities", TaskActivityRoutes);

export default router;

