import express from "express";
import {
  getTaskActivities,
  getTaskActivity,
  createTaskActivity,
  updateTaskActivity,
  deleteTaskActivity,
  restoreTaskActivity,
} from "../controllers/taskActivityControllers.js";
import {
  createTaskActivityValidator,
  updateTaskActivityValidator,
  taskActivityIdValidator,
} from "../middlewares/validators/taskActivityValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", verifyJWT, authorize("TaskActivity", "read"), getTaskActivities);
router.get("/:resourceId", verifyJWT, taskActivityIdValidator, authorize("TaskActivity", "read"), getTaskActivity);
router.post("/", verifyJWT, createTaskActivityValidator, authorize("TaskActivity", "create"), createTaskActivity);
router.put("/:resourceId", verifyJWT, taskActivityIdValidator, updateTaskActivityValidator, authorize("TaskActivity", "update"), updateTaskActivity);
router.delete("/:resourceId", verifyJWT, taskActivityIdValidator, authorize("TaskActivity", "delete"), deleteTaskActivity);
router.patch("/:resourceId/restore", verifyJWT, taskActivityIdValidator, authorize("TaskActivity", "update"), restoreTaskActivity);

export default router;
