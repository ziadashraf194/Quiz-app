const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
  name: String,
  score: Number,
  duration_display: String,
  timestamp: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", resultSchema);
