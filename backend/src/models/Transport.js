import mongoose from "mongoose";

const TransportSchema = new mongoose.Schema(
  {
    transportId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Transport = mongoose.model("Transport", TransportSchema);
