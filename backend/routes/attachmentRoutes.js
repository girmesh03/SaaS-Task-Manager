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
} from "../middlewares/validators/attachmentValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", verifyJWT, authorize("Attachment", "read"), getAttachments);
router.get("/:resourceId", verifyJWT, attachmentIdValidator, authorize("Attachment", "read"), getAttachment);
router.post("/", verifyJWT, createAttachmentValidator, authorize("Attachment", "create"), createAttachment);
router.delete("/:resourceId", verifyJWT, attachmentIdValidator, authorize("Attachment", "delete"), deleteAttachment);
router.patch("/:resourceId/restore", verifyJWT, attachmentIdValidator, authorize("Attachment", "update"), restoreAttachment);

export default router;
