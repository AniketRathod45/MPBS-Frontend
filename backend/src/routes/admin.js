import express from "express";
import { 
  getDashboardStats,
  listUsers, 
  createUser, 
  updateUserAuth,
  deleteUser,
  updateUser,
  resetUserPassword,
} from "../controllers/adminController.js";
import {
  createRoutePlan,
  createTanker,
  createTransport,
  deleteRoutePlan,
  deleteTanker,
  deleteTransport,
  getRoutePlan,
  getTanker,
  getTransport,
  listRouteNavigationOptions,
  listRoutePlans,
  listTankers,
  listTransports,
  updateRoutePlan,
  updateTanker,
  updateTransport,
} from "../controllers/routeNavigationController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin"]));

router.get("/stats", getDashboardStats);

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

router.patch(
  "/users/:id",
  validate(
    z.object({
      username: z.string().min(3).optional(),
      role: z.enum(["Admin", "Society", "BMC", "EO", "Dairy", "Other"]).optional(),
      authStatus: z.enum(["Approved", "Pending", "Rejected"]).optional(),
      profile: z.record(z.any()).optional(),
    })
  ),
  updateUser
);

router.delete("/users/:id", deleteUser);

router.post(
  "/users/:id/reset-password",
  validate(z.object({ newPassword: z.string().min(6) })),
  resetUserPassword
);

router.get("/route-navigation/options", listRouteNavigationOptions);

router.get("/transports", listTransports);
router.get("/transports/:id", getTransport);
router.post(
  "/transports",
  validate(
    z.object({
      transportId: z.string().min(1),
      name: z.string().min(1),
      phone: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
    })
  ),
  createTransport
);
router.patch(
  "/transports/:id",
  validate(
    z.object({
      transportId: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      phone: z
        .string()
        .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits")
        .optional(),
    })
  ),
  updateTransport
);
router.delete("/transports/:id", deleteTransport);

router.get("/tankers", listTankers);
router.get("/tankers/:id", getTanker);
router.post(
  "/tankers",
  validate(
    z.object({
      tankerId: z.string().min(1),
      plateNo: z.string().optional(),
      capacityLiters: z.number().min(1),
      transportId: z.string().optional().nullable(),
    })
  ),
  createTanker
);
router.patch(
  "/tankers/:id",
  validate(
    z.object({
      tankerId: z.string().min(1).optional(),
      plateNo: z.string().optional(),
      capacityLiters: z.number().min(1).optional(),
      transportId: z.string().optional().nullable(),
    })
  ),
  updateTanker
);
router.delete("/tankers/:id", deleteTanker);

router.get("/routes", listRoutePlans);
router.get("/routes/:id", getRoutePlan);
router.post(
  "/routes",
  validate(
    z.object({
      routeCode: z.string().min(1),
      routeName: z.string().min(1),
      transportId: z.string().optional().nullable(),
      tankerId: z.string().optional().nullable(),
      bmcIds: z.array(z.string().min(1)).min(1),
    })
  ),
  createRoutePlan
);
router.patch(
  "/routes/:id",
  validate(
    z.object({
      routeCode: z.string().min(1).optional(),
      routeName: z.string().min(1).optional(),
      transportId: z.string().optional().nullable(),
      tankerId: z.string().optional().nullable(),
      bmcIds: z.array(z.string().min(1)).min(1).optional(),
    })
  ),
  updateRoutePlan
);
router.delete("/routes/:id", deleteRoutePlan);

export default router;

