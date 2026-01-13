import express from "express";
import {
  getTaskComments,
  getTaskComment,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  restoreTaskComment,
  toggleLikeComment,
  getCommentLikes,
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

router.get(
  "/",
  verifyJWT,
  getTaskCommentsValidator,
  authorize("TaskComment", "read"),
  getTaskComments
);
router.get(
  "/:commentId",
  verifyJWT,
  taskCommentIdValidator,
  authorize("TaskComment", "read"),
  getTaskComment
);
router.post(
  "/",
  verifyJWT,
  createTaskCommentValidator,
  authorize("TaskComment", "create"),
  createTaskComment
);
router.patch(
  "/:commentId",
  verifyJWT,
  taskCommentIdValidator,
  updateTaskCommentValidator,
  authorize("TaskComment", "update"),
  updateTaskComment
);
router.delete(
  "/:commentId",
  verifyJWT,
  taskCommentIdValidator,
  authorize("TaskComment", "delete"),
  deleteTaskComment
);
router.patch(
  "/:commentId/restore",
  verifyJWT,
  taskCommentIdValidator,
  authorize("TaskComment", "update"),
  restoreTaskComment
);

// Like endpoints
router.post(
  "/:commentId/like",
  verifyJWT,
  taskCommentIdValidator,
  authorize("TaskComment", "read"), // Any user who can read can like
  toggleLikeComment
);
router.get(
  "/:commentId/likes",
  verifyJWT,
  taskCommentIdValidator,
  authorize("TaskComment", "read"),
  getCommentLikes
);

export default router;
