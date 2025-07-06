window.onload = () => {
    loadAllExams();
  };
  
  function loadAllExams() {
    fetch("/exams")
      .then((res) => res.json())
      .then((data) => {
        const container = document.getElementById("examList");
        container.innerHTML = "";
  
        if (!data.length) {
          container.innerHTML = "<p>❗ لا يوجد امتحانات بعد</p>";
          return;
        }
  
        data.forEach((exam) => {
          const box = document.createElement("div");
          box.style.border = "1px solid #ccc";
          box.style.padding = "15px";
          box.style.marginBottom = "15px";
          box.style.backgroundColor = "#fdfdfd";
          box.style.borderRadius = "6px";
  
          const title = exam.title || "امتحان بدون عنوان";
          const examId = exam._id;
  
          box.innerHTML = `
            <h3 style="margin-bottom: 10px;">
              📝 <span contenteditable="true" onblur="updateTitle('${examId}', this.innerText)">${title}</span>
            </h3>
  
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              <button onclick="copyStudentLink('${examId}')">📋 نسخ رابط الطالب</button>
              <button onclick="goToEditor('${examId}')">✏️ تعديل الأسئلة</button>
              <button onclick="goToResults('${examId}')">📊 نتائج الطلاب</button>
              <button onclick="deleteExam('${examId}')" style="background-color: #e74c3c; color: #fff;">🗑️ حذف الامتحان</button>
            </div>
          `;
  
          container.appendChild(box);
        });
      })
      .catch((err) => {
        console.error("❌ فشل تحميل الامتحانات:", err);
      });
  }
  
  function createNewExam() {
    fetch("/exams/create", { method: "POST" })
      .then((res) => res.json())
      .then(() => {
        alert("✅ تم إنشاء الامتحان الجديد");
        loadAllExams();
      })
      .catch((err) => {
        console.error("❌ فشل في إنشاء الامتحان:", err);
        alert("حدث خطأ أثناء إنشاء الامتحان");
      });
  }
  
  function updateTitle(examId, newTitle) {
    fetch(`/exams/${examId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    })
      .then(() => console.log("✅ تم تحديث العنوان"))
      .catch((err) => console.error("❌ خطأ في تعديل العنوان:", err));
  }
  
  function copyStudentLink(examId) {
    const url = `${window.location.origin}/index.html?exam=${examId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("📎 تم نسخ رابط الطالب إلى الحافظة"))
      .catch((err) => console.error("❌ فشل نسخ الرابط:", err));
  }
  
  function goToEditor(examId) {
    location.href = `admin.html?exam=${examId}`;
  }
  
  function goToResults(examId) {
    location.href = `results.html?exam=${examId}`;
  }
  
  // 🗑️ حذف الامتحان مع تأكيد
  function deleteExam(examId) {
    if (confirm("⚠️ هل أنت متأكد أنك تريد حذف هذا الامتحان؟")) {
      fetch(`/exams/${examId}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          alert("🗑️ تم حذف الامتحان");
          loadAllExams();
        })
        .catch((err) => {
          console.error("❌ فشل الحذف:", err);
          alert("حدث خطأ أثناء الحذف");
        });
    }
  }
  