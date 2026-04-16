import mongoose from "mongoose";

const SocietySchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, unique: true },
    societyNo: { type: String },
    societyName: { type: String, required: true },
    district: { type: String },
    taluk: { type: String },
    hobli: { type: String },
    route: { type: String },
    bmcId: { type: String },
    eoId: { type: String },
    contactNumber: { type: String },
    address: { type: String },
    bankDetails: { type: Object, default: {} },
    pan: { type: String },
    buildingType: { type: String },
    memberCounts: { type: Object, default: {} },
    farmerCounts: { type: Object, default: {} },
    feedMineral: { type: Array, default: [] },
  },
  { timestamps: true }
);

export const Society = mongoose.model("Society", SocietySchema);

