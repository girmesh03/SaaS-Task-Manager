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
  getTaskActivitiesValidator,
} from "../middlewares/validators/taskActivityValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get(
  "/",
  verifyJWT,
  getTaskActivitiesValidator,
  authorize("TaskActivity", "read"),
  getTaskActivities
);
router.get(
  "/:activityId",
  verifyJWT,
  taskActivityIdValidator,
  authorize("TaskActivity", "read"),
  getTaskActivity
);
router.post(
  "/",
  verifyJWT,
  createTaskActivityValidator,
  authorize("TaskActivity", "create"),
  createTaskActivity
);
router.patch(
  "/:activityId",
  verifyJWT,
  taskActivityIdValidator,
  updateTaskActivityValidator,
  authorize("TaskActivity", "update"),
  updateTaskActivity
);
router.delete(
  "/:activityId",
  verifyJWT,
  taskActivityIdValidator,
  authorize("TaskActivity", "delete"),
  deleteTaskActivity
);
router.patch(
  "/:activityId/restore",
  verifyJWT,
  taskActivityIdValidator,
  authorize("TaskActivity", "update"),
  restoreTaskActivity
);

export default router;
