import express from "express";

import AuthRoutes from "./authRoutes.js";
import OrganizationRoutes from "./organizationRoutes.js";
import DepartmentRoutes from "./departmentRoutes.js";
import UserRoutes from "./userRoutes.js";
import VendorRoutes from "./vendorRoutes.js";
import MaterialRoutes from "./materialRoutes.js";
import TaskRoutes from "./taskRoutes.js";
import TaskActivityRoutes from "./taskActivityRoutes.js";
import TaskCommentRoutes from "./taskCommentRoutes.js";
import AttachmentRoutes from "./attachmentRoutes.js";
import NotificationRoutes from "./notificationRoutes.js";

const router = express.Router();

router.use("/auth", AuthRoutes);
router.use("/organizations", OrganizationRoutes);
router.use("/departments", DepartmentRoutes);
router.use("/users", UserRoutes);
router.use("/vendors", VendorRoutes);
router.use("/materials", MaterialRoutes);
router.use("/tasks", TaskRoutes);
// router.use("/task-activities", TaskActivityRoutes);
router.use("/activities", TaskActivityRoutes);
// router.use("/task-comments", TaskCommentRoutes);
router.use("/comments", TaskCommentRoutes);
router.use("/attachments", AttachmentRoutes);
router.use("/notifications", NotificationRoutes);

export default router;
