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
} from "../middlewares/validators/taskValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", verifyJWT, authorize("Task", "read"), getTasks);
router.get("/:resourceId", verifyJWT, taskIdValidator, authorize("Task", "read"), getTask);
router.post("/", verifyJWT, createTaskValidator, authorize("Task", "create"), createTask);
router.put("/:resourceId", verifyJWT, taskIdValidator, updateTaskValidator, authorize("Task", "update"), updateTask);
router.delete("/:resourceId", verifyJWT, taskIdValidator, authorize("Task", "delete"), deleteTask);
router.patch("/:resourceId/restore", verifyJWT, taskIdValidator, authorize("Task", "update"), restoreTask);

export default router;
