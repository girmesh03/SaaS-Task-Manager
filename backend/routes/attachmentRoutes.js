import express from "express";
import {
  getAttachments,
  getAttachment,
  createAttachment,
  deleteAttachment,
  restoreAttachment,
} from "../controllers/attachmentControllers.js";
import {
  createAttachmentValidator,
  attachmentIdValidator,
  getAttachmentsValidator,
} from "../middlewares/validators/attachmentValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", verifyJWT, getAttachmentsValidator, authorize("Attachment", "read"), getAttachments);
router.get("/:attachmentId", verifyJWT, attachmentIdValidator, authorize("Attachment", "read"), getAttachment);
router.post("/", verifyJWT, createAttachmentValidator, authorize("Attachment", "create"), createAttachment);
router.delete("/:attachmentId", verifyJWT, attachmentIdValidator, authorize("Attachment", "delete"), deleteAttachment);
router.patch("/:attachmentId/restore", verifyJWT, attachmentIdValidator, authorize("Attachment", "update"), restoreAttachment);

export default router;
