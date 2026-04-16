import mongoose from "mongoose";

const RoutePlanSchema = new mongoose.Schema(
  {
    routeCode: { type: String, required: true, unique: true, index: true },
    routeName: { type: String, required: true },
    transportId: { type: mongoose.Schema.Types.ObjectId, ref: "Transport", default: null },
    tankerId: { type: mongoose.Schema.Types.ObjectId, ref: "Tanker", default: null },
    bmcIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const RoutePlan = mongoose.model("RoutePlan", RoutePlanSchema);
