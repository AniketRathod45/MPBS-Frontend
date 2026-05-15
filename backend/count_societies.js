const mongoose = require("mongoose");
const uri = "mongodb://127.0.0.1:27017/mpbs";

const SocietySchema = new mongoose.Schema({
    bmcId: { type: String },
});
const Society = mongoose.model("Society", SocietySchema);

async function run() {
    try {
        await mongoose.connect(uri);
        const results = await Society.aggregate([
            { $group: { _id: "$bmcId", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        console.log("JSON_START" + JSON.stringify(results) + "JSON_END");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
