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
  getTaskCommentsValidator,
} from "../middlewares/validators/taskCommentValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", verifyJWT, getTaskCommentsValidator, authorize("TaskComment", "read"), getTaskComments);
router.get("/:taskCommentId", verifyJWT, taskCommentIdValidator, authorize("TaskComment", "read"), getTaskComment);
router.post("/", verifyJWT, createTaskCommentValidator, authorize("TaskComment", "create"), createTaskComment);
router.patch("/:taskCommentId", verifyJWT, taskCommentIdValidator, updateTaskCommentValidator, authorize("TaskComment", "update"), updateTaskComment);
router.delete("/:taskCommentId", verifyJWT, taskCommentIdValidator, authorize("TaskComment", "delete"), deleteTaskComment);
router.patch("/:taskCommentId/restore", verifyJWT, taskCommentIdValidator, authorize("TaskComment", "update"), restoreTaskComment);

export default router;
