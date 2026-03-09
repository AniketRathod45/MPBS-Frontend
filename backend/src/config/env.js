import dotenv from "dotenv";

dotenv.config();

const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";
const corsOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs",
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  corsOrigins,
  nodeEnv: process.env.NODE_ENV || "development",
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
  },
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 5),
};
