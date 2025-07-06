// تحميل متغيرات البيئة
require("dotenv").config();

// تحميل المكتبات المطلوبة
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// تحميل النماذج
const Exam = require("./models/Exam");
const Result = require("./models/Result");

const app = express();
const PORT = process.env.PORT || 3000;

// الوسيطات (middlewares)
app.use(cors());
app.use(express.json());
app.use(express.static("frontend")); // لتقديم ملفات HTML + JS + CSS

// الاتصال بقاعدة البيانات
mongoose
  .connect("MONGO_URI=mongodb+srv://ziad1942007:ziad1942007@cluster0.ibid538.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ تم الاتصال بـ MongoDB"))
  .catch((err) => console.error("❌ فشل الاتصال:", err));

// 🔹 جلب جميع الامتحانات
app.get("/exams", async (req, res) => {
  const exams = await Exam.find().sort({ created_at: -1 });
  res.json(exams);
});

// 🔹 جلب امتحان بشكل JSON متوافق مع الواجهة
app.get("/exams/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "❌ الامتحان غير موجود" });

    // ✅ تنسيقه كـ Array:
    const meta = {
      title: exam.title,
      duration_minutes: exam.duration_minutes,
      show_answers: exam.show_answers,
    };

    res.json([meta, ...exam.questions]);
  } catch (err) {
    res.status(400).json({ error: "❌ معرّف غير صالح" });
  }
});

// 🔹 إنشاء امتحان جديد
app.post("/exams/create", async (req, res) => {
  const exam = await Exam.create({ title: "اختبار جديد" });
  res.json({ message: "✅ تم الإنشاء", exam });
});

// 🔹 تعديل امتحان (بما في ذلك الأسئلة)
app.post("/exams/:id", async (req, res) => {
  try {
    await Exam.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "✅ تم الحفظ" });
  } catch (err) {
    res.status(500).json({ error: "❌ فشل في الحفظ", details: err.message });
  }
});

// 🔹 حذف امتحان
app.delete("/exams/:id", async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  res.json({ message: "🗑️ تم حذف الامتحان" });
});

// 🔹 حفظ نتيجة طالب
app.post("/results/:id", async (req, res) => {
  try {
    const result = await Result.create({
      exam_id: req.params.id,
      ...req.body,
    });
    res.json({ message: "✅ تم حفظ النتيجة", result });
  } catch (err) {
    res.status(500).json({ error: "❌ فشل في حفظ النتيجة", details: err.message });
  }
});

// 🔹 جلب نتائج امتحان معين
app.get("/results/:id", async (req, res) => {
  const results = await Result.find({ exam_id: req.params.id }).sort({ created_at: -1 });
  res.json(results);
});

// ✅ تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على: http://localhost:${PORT}`);
});
