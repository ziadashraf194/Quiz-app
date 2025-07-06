const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: String,
  answer_1: String,
  answer_2: String,
  answer_3: String,
  answer_4: String,
  right_answer: String,
  score: { type: Number, default: 1 }
});

const examSchema = new mongoose.Schema({
  title: String,
  duration_minutes: { type: Number, default: 10 },
  show_answers: { type: Boolean, default: true },
  questions: [questionSchema],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Exam", examSchema);
