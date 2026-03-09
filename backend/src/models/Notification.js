import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    sentToRole: { type: String, required: true },
    message: { type: String, required: true },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
