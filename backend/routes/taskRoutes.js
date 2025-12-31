import express from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
} from "../controllers/taskControllers.js";
import {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  getTasksValidator,
} from "../middlewares/validators/taskValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", verifyJWT, getTasksValidator, authorize("Task", "read"), getTasks);
router.get("/:taskId", verifyJWT, taskIdValidator, authorize("Task", "read"), getTask);
router.post("/", verifyJWT, createTaskValidator, authorize("Task", "create"), createTask);
router.put("/:taskId", verifyJWT, taskIdValidator, updateTaskValidator, authorize("Task", "update"), updateTask);
router.delete("/:taskId", verifyJWT, taskIdValidator, authorize("Task", "delete"), deleteTask);
router.patch("/:taskId/restore", verifyJWT, taskIdValidator, authorize("Task", "update"), restoreTask);

export default router;
