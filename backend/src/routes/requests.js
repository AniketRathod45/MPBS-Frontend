import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { listRequests, createRequest, updateRequestStatus } from "../controllers/requestController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

router.get("/", authRequired, requireRole(["Admin"]), listRequests);

router.post(
  "/",
  validate(
    z.object({
      type: z.string().min(1),
      userId: z.string().optional(),
      username: z.string().optional(),
      role: z.string().optional(),
      newPassword: z.string().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      message: z.string().optional(),
    })
  ),
  createRequest
);

router.patch(
  "/:id",
  authRequired,
  requireRole(["Admin"]),
  validate(z.object({ status: z.enum(["pending", "approved", "rejected"]) })),
  updateRequestStatus
);

export default router;
