import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { getAuditReport, listAuditReportTypes } from "../controllers/auditController.js";

const router = express.Router();

// Public debug endpoints (no auth) - useful during development to verify responses
router.get("/public", listAuditReportTypes);
router.get("/public/:role", getAuditReport);

router.use(authRequired, requireRole(["Admin", "Account", "Accounts", "Auditor", "Audit", "Society", "BMC", "Dairy"]));

router.get("/", (req, res, next) => {
	if (req.query.role) {
		return getAuditReport(req, res, next);
	}

	return listAuditReportTypes(req, res, next);
});
router.get("/:role", getAuditReport);

export default router;