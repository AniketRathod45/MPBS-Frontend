import express from "express";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createTankerVerification,
  deleteTankerVerification,
  getTankerVerification,
  listTankerVerifications,
  updateTankerVerification,
} from "../controllers/tankerVerificationController.js";

const router = express.Router();

const issueValueSchema = z.object({
  fat: z.string(),
  snf: z.string(),
  qty: z.string(),
});

const stopSchema = z.object({
  bmc: z.string().min(1),
  societies: z.number(),
  milkType: z.string().min(1),
  expected: z.number(),
  received: z.number(),
});

const qualitySchema = z.object({
  parameter: z.string().min(1),
  routeSheet: z.string(),
  dairyTest: z.string(),
});

const reportedIssueSchema = z.object({
  reportMilkSummary: z.object({
    cowExpected: z.string(),
    cowReceived: z.string(),
    buffaloExpected: z.string(),
    buffaloReceived: z.string(),
  }),
  reportQuality: z.object({
    cowFat: z.string(),
    cowSmp: z.string(),
    buffaloFat: z.string(),
    buffaloSmp: z.string(),
  }),
  issueComparisonGroups: z.array(
    z.object({
      type: z.string(),
      received: issueValueSchema,
      added: issueValueSchema,
    })
  ),
});

router.use(authRequired, requireRole(["Admin", "Dairy"]));

router.get("/", listTankerVerifications);
router.post(
  "/",
  validate(
    z.object({
      tankerId: z.string().min(1),
      route: z.string().min(1),
      arrivalTime: z.string().optional(),
      transporter: z.string().optional(),
      status: z.enum(["pending", "approved", "rejected", "penalty"]).optional(),
      stops: z.array(stopSchema).optional(),
      quality: z.array(qualitySchema).optional(),
      reportedIssue: reportedIssueSchema.nullable().optional(),
    })
  ),
  createTankerVerification
);
router.get("/:id", getTankerVerification);
router.patch(
  "/:id",
  validate(
    z.object({
      status: z.enum(["pending", "approved", "rejected", "penalty"]).optional(),
      tankerId: z.string().min(1).optional(),
      route: z.string().min(1).optional(),
      arrivalTime: z.string().optional(),
      transporter: z.string().optional(),
      stops: z.array(stopSchema).optional(),
      quality: z.array(qualitySchema).optional(),
      reportedIssue: reportedIssueSchema.nullable().optional(),
    })
  ),
  updateTankerVerification
);
router.delete("/:id", requireRole(["Admin"]), deleteTankerVerification);

export default router;
