import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { listNotifications, createNotification } from "../controllers/notificationController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

router.get("/", authRequired, listNotifications);

router.post(
  "/",
  authRequired,
  requireRole(["Admin"]),
  validate(
    z.object({
      sentToRole: z.string().min(1),
      message: z.string().min(1),
      fileUrl: z.string().optional(),
    })
  ),
  createNotification
);

export default router;

