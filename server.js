const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("frontend"));

// جلب جميع الامتحانات
app.get("/exams", (req, res) => {
  const dir = path.join(__dirname, "exams");
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: "فشل في جلب الامتحانات" });
    const exams = files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""));
    res.json(exams);
  });
});

// جلب بيانات امتحان واحد
app.get("/exams/:id", (req, res) => {
  const id = req.params.id;
  const file = path.join(__dirname, "exams", `${id}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: "امتحان غير موجود" });
  }
  fs.readFile(file, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "فشل في جلب الامتحان" });
    res.json(JSON.parse(data));
  });
});

// إنشاء امتحان جديد (فارغ)
app.post("/exams/create", (req, res) => {
  const dir = path.join(__dirname, "exams");
  let idx = 1;
  while (fs.existsSync(path.join(dir, `${idx}.json`))) idx++;
  fs.writeFileSync(path.join(dir, `${idx}.json`), JSON.stringify([
    { title: `امتحان جديد (${idx})`, duration_minutes: 10, show_answers: true }
  ], null, 2));
  res.json({ message: `✅ تم إنشاء امتحان جديد (${idx})`, id: idx });
});

// تحديث امتحان (أسئلة أو بيانات)
app.post("/exams/:id", (req, res) => {
  const id = req.params.id;
  const file = path.join(__dirname, "exams", `${id}.json`);
  fs.writeFile(file, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).json({ error: "فشل في حفظ التغييرات" });
    res.json({ message: "✅ تم حفظ الامتحان" });
  });
});

// تغيير اسم الامتحان فقط
app.post("/exams/:id/title", (req, res) => {
  const id = req.params.id;
  const file = path.join(__dirname, "exams", `${id}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: "امتحان غير موجود" });
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data[0].title = req.body.title || data[0].title;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  res.json({ message: "✅ تم تعديل الاسم" });
});

// حذف امتحان ونتائجه
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

// جلب نتائج امتحان
app.get("/results/:id", (req, res) => {
  const id = req.params.id;
  const file = path.join(__dirname, "results", `${id}.json`);
  if (!fs.existsSync(file)) {
    return res.json([]); // لا توجد نتائج بعد
  }
  fs.readFile(file, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "فشل في جلب النتائج" });
    res.json(JSON.parse(data));
  });
});

// إضافة نتيجة طالب
app.post("/results/:id", (req, res) => {
  const id = req.params.id;
  const file = path.join(__dirname, "results", `${id}.json`);
  let results = [];
  if (fs.existsSync(file)) {
    results = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  results.push(req.body);
  fs.writeFileSync(file, JSON.stringify(results, null, 2));
  res.json({ message: "✅ تم حفظ النتيجة" });
});

// حذف ملف النتائج فقط
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
