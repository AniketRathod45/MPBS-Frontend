import mongoose from "mongoose";
import { Society } from "../src/models/Society.js";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/mpbs");
  const total = await Society.countDocuments();
  const byBmc = await Society.aggregate([
    { $match: { bmcId: { $exists: true, $ne: null, $ne: "" } } },
    { $group: { _id: "$bmcId", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);

  console.log(JSON.stringify({ total, byBmc }, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
