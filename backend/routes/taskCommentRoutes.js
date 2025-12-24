import express from "express";
import {
  getTaskComments,
  getTaskComment,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  restoreTaskComment,
} from "../controllers/taskCommentControllers.js";
import {
  createTaskCommentValidator,
  updateTaskCommentValidator,
  taskCommentIdValidator,
} from "../middlewares/validators/taskCommentValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", verifyJWT, authorize("TaskComment", "read"), getTaskComments);
router.get("/:resourceId", verifyJWT, taskCommentIdValidator, authorize("TaskComment", "read"), getTaskComment);
router.post("/", verifyJWT, createTaskCommentValidator, authorize("TaskComment", "create"), createTaskComment);
router.put("/:resourceId", verifyJWT, taskCommentIdValidator, updateTaskCommentValidator, authorize("TaskComment", "update"), updateTaskComment);
router.delete("/:resourceId", verifyJWT, taskCommentIdValidator, authorize("TaskComment", "delete"), deleteTaskComment);
router.patch("/:resourceId/restore", verifyJWT, taskCommentIdValidator, authorize("TaskComment", "update"), restoreTaskComment);

export default router;
