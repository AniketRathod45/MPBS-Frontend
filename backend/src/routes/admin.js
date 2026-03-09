import express from "express";
import { listUsers, createUser, updateUserAuth } from "../controllers/adminController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin"]));

router.get("/users", listUsers);

router.post(
  "/users",
  validate(
    z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      role: z.enum(["Admin", "Society", "BMC", "EO", "Dairy", "Other"]),
      profile: z.record(z.any()).optional(),
    })
  ),
  createUser
);

router.patch(
  "/users/:id/auth",
  validate(z.object({ authStatus: z.enum(["Approved", "Pending", "Rejected"]) })),
  updateUserAuth
);

export default router;

