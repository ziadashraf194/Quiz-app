const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

// ✅ إعداد الجلسة
app.use(session({
  secret: "admin-session-secret", // غيّرها في مشروعك الحقيقي
  resave: false,
  saveUninitialized: false
}));

// ✅ بيانات تسجيل الدخول
const ADMIN = { username: "admin", password: "1234" };

// ✅ مسار تسجيل الدخول
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// ✅ حماية الصفحات (يوضع قبل الملفات الثابتة)
app.use((req, res, next) => {
  const isPublic =
    req.path === "/" ||
    req.path === "/index.html" ||
    req.path === "/login.html" ||
    req.path === "/login";

  const isStatic = /\.(css|js|png|jpg|jpeg|ico|woff2?)$/.test(req.path);

  if (req.session.isAdmin || isPublic || isStatic) {
    return next();
  }

  // ❌ محاولة دخول صفحة غير مصرح بها
  return res.sendFile(path.join(__dirname, "frontend", "404.html"));
});

// ✅ تقديم الملفات الثابتة
app.use(express.static("frontend"));

// ✅ حذف امتحان + نتيجته
app.delete("/exams/:id", (req, res) => {
  const id = req.params.id;
  const examPath = path.join(__dirname, "exams", `${id}.json`);
  const resultPath = path.join(__dirname, "results", `${id}.json`);
  let deleted = [];

  try {
    if (fs.existsSync(examPath)) {
      fs.unlinkSync(examPath);
      deleted.push(`exams/${id}.json`);
    }

    if (fs.existsSync(resultPath)) {
      fs.unlinkSync(resultPath);
      deleted.push(`results/${id}.json`);
    }

    if (deleted.length === 0) {
      return res.status(404).json({ message: "⚠️ لا توجد ملفات بهذا الاسم." });
    }

    res.json({ message: `✅ تم حذف: \n${deleted.join("\n")}` });
  } catch (err) {
    console.error("❌ خطأ أثناء الحذف:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء الحذف." });
  }
});

// ✅ حذف ملف النتائج فقط
app.delete("/results/:id", (req, res) => {
  const id = req.params.id;
  const resultPath = path.join(__dirname, "results", `${id}.json`);

  try {
    if (fs.existsSync(resultPath)) {
      fs.unlinkSync(resultPath);
      res.json({ message: `✅ تم حذف ملف النتائج للامتحان ${id}.` });
    } else {
      res.status(404).json({ error: "⚠️ ملف النتائج غير موجود." });
    }
  } catch (err) {
    console.error("❌ خطأ أثناء حذف النتائج:", err.message);
    res.status(500).json({ error: "فشل في حذف النتائج." });
  }
});

// ✅ تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على: http://localhost:${PORT}`);
});
