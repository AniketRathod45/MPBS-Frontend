import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import { config } from "./config/env.js";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import societyRoutes from "./routes/societies.js";
import milkRoutes from "./routes/milkEntries.js";
import verificationRoutes from "./routes/verifications.js";
import rateRoutes from "./routes/rates.js";
import dashboardRoutes from "./routes/dashboards.js";
import notificationRoutes from "./routes/notifications.js";
import requestRoutes from "./routes/requests.js";
import reportRoutes from "./routes/reports.js";
import uploadRoutes from "./routes/uploads.js";
import { applySecurity } from "./middleware/security.js";

const app = express();
applySecurity(app);

function isAllowedDevelopmentOrigin(origin) {
  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      const isDevelopment = String(config.nodeEnv || "").toLowerCase() === "development";
      if (!origin) return callback(null, true);
      if (isDevelopment && isAllowedDevelopmentOrigin(origin)) {
        return callback(null, true);
      }
      if (config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/societies", societyRoutes);
app.use("/milk-entries", milkRoutes);
app.use("/verifications", verificationRoutes);
app.use("/rates", rateRoutes);
app.use("/dashboards", dashboardRoutes);
app.use("/notifications", notificationRoutes);
app.use("/requests", requestRoutes);
app.use("/reports", reportRoutes);
app.use("/uploads", uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const start = async () => {
  await connectDb();
  const server = app.listen(config.port, () => {
    console.log(`API listening on :${config.port}`);
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use. Stop the existing backend process before starting a new one.`);
      process.exit(1);
      return;
    }

    console.error("Server failed to start:", error);
    process.exit(1);
  });
};

start();
