import mongoose from "mongoose";

const TankerSchema = new mongoose.Schema(
  {
    tankerId: { type: String, required: true, unique: true, index: true },
    plateNo: { type: String, default: "" },
    capacityLiters: { type: Number, required: true, min: 1 },
    transportId: { type: mongoose.Schema.Types.ObjectId, ref: "Transport", default: null },
  },
  { timestamps: true }
);

export const Tanker = mongoose.model("Tanker", TankerSchema);
