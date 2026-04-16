import mongoose from "mongoose";

const TankerStopSchema = new mongoose.Schema(
  {
    bmc: { type: String, required: true },
    societies: { type: Number, default: 0 },
    milkType: { type: String, required: true },
    expected: { type: Number, required: true },
    received: { type: Number, required: true },
  },
  { _id: false }
);

const TankerQualitySchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true },
    routeSheet: { type: String, required: true },
    dairyTest: { type: String, required: true },
  },
  { _id: false }
);

const TankerIssueValuesSchema = new mongoose.Schema(
  {
    fat: { type: String, default: "0" },
    snf: { type: String, default: "0" },
    qty: { type: String, default: "0" },
  },
  { _id: false }
);

const TankerIssueComparisonGroupSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    received: { type: TankerIssueValuesSchema, required: true },
    added: { type: TankerIssueValuesSchema, required: true },
  },
  { _id: false }
);

const TankerReportedIssueSchema = new mongoose.Schema(
  {
    reportMilkSummary: {
      cowExpected: { type: String, default: "0" },
      cowReceived: { type: String, default: "0" },
      buffaloExpected: { type: String, default: "0" },
      buffaloReceived: { type: String, default: "0" },
    },
    reportQuality: {
      cowFat: { type: String, default: "0" },
      cowSmp: { type: String, default: "0" },
      buffaloFat: { type: String, default: "0" },
      buffaloSmp: { type: String, default: "0" },
    },
    issueComparisonGroups: { type: [TankerIssueComparisonGroupSchema], default: [] },
  },
  { _id: false }
);

const TankerVerificationSchema = new mongoose.Schema(
  {
    routePlanId: { type: mongoose.Schema.Types.ObjectId, ref: "RoutePlan", index: true, sparse: true },
    tankerId: { type: String, required: true, index: true },
    route: { type: String, required: true },
    arrivalTime: { type: String, default: "-" },
    transporter: { type: String, default: "-" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "penalty"],
      default: "pending",
      index: true,
    },
    stops: { type: [TankerStopSchema], default: [] },
    quality: { type: [TankerQualitySchema], default: [] },
    reportedIssue: { type: TankerReportedIssueSchema, default: null },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export const TankerVerification = mongoose.model("TankerVerification", TankerVerificationSchema);
