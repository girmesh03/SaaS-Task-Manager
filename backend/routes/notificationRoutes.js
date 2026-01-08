import express from "express";
import {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationControllers.js";
import { notificationIdValidator, getNotificationsValidator } from "../middlewares/validators/notificationValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

/**
 * Notification Routes
 *
 * CRITICAL: Own user access only for most operations.
 * Authorization middleware usually checks role/scope, but here we strictly scope to own user.
 * We use `verifyJWT` to identify the user.
 * Is "authorize" needed? "authorize" checks permissions on resources.
 * 'Notification' resource might have 'read', 'delete'.
 * We will use authorize("Notification", "read") etc.
 * But controller must enforce owner check strict.
 */

router.get("/", verifyJWT, getNotificationsValidator, authorize("Notification", "read"), getNotifications);
router.get("/:notificationId", verifyJWT, notificationIdValidator, authorize("Notification", "read"), getNotification);
router.patch("/:notificationId/read", verifyJWT, notificationIdValidator, authorize("Notification", "update"), markAsRead);
router.patch("/read-all", verifyJWT, authorize("Notification", "update"), markAllAsRead);
router.delete("/:notificationId", verifyJWT, notificationIdValidator, authorize("Notification", "delete"), deleteNotification);

export default router;
