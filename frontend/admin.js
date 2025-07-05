let examId = null;
let questions = [];
let examTitle = "";
let allowReview = true;

// عند تحميل الصفحة
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  examId = urlParams.get("exam");

  if (!examId) {
    alert("❌ لم يتم تحديد رقم الامتحان في الرابط (مثال: admin.html?exam=2)");
    return;
  }

  loadExam();
};

// تحميل بيانات الامتحان
function loadExam() {
  fetch(`/exams/${examId}`)
    .then(res => res.json())
    .then(data => {
      const meta = data[0];
      examTitle = meta.title || `اختبار رقم ${examId}`;
      const duration = meta.duration_minutes || 10;
      allowReview = meta.show_answers !== false;

      document.getElementById("duration").value = duration;
      document.getElementById("showAnswers").value = allowReview ? "true" : "false";
      document.getElementById("examTitle").textContent = examTitle;

      questions = data.slice(1);
      updatePreview();
    });
}

// عرض المعاينة
function updatePreview() {
    const preview = document.getElementById("preview");
    preview.textContent = JSON.stringify(questions, null, 2);
  
    const list = document.getElementById("questionList");
    list.innerHTML = "";
  
    questions.forEach((q, i) => {
      const item = document.createElement("li");
      item.className = "question-item";
      item.setAttribute("draggable", "true");
      item.dataset.index = i;
  
      item.innerHTML = `
        <div style="border:1px solid #ccc; padding:10px; background:#fafafa;">
          <strong>${i + 1}) ${q.title} (درجة: ${q.score})</strong><br>
          <button onclick="loadQuestionToForm(${i})">✏️ تعديل</button>
          <button onclick="deleteQuestion(${i})">🗑️ حذف</button>
        </div>
      `;
  
      list.appendChild(item);
    });
  
    enableDragAndDrop();
  }
  
  function enableDragAndDrop() {
    const list = document.getElementById("questionList");
    let draggedIndex = null;
  
    const items = list.querySelectorAll("li");
  
    items.forEach((item, i) => {
      item.setAttribute("draggable", true);
      item.dataset.index = i;
  
      item.ondragstart = () => {
        draggedIndex = i;
        item.classList.add("dragging");
      };
  
      item.ondragend = () => {
        draggedIndex = null;
        item.classList.remove("dragging");
        document.querySelectorAll(".drop-placeholder").forEach(p => p.remove());
      };
  
      item.ondragover = e => {
        e.preventDefault();
  
        const overItem = e.currentTarget;
        const bounding = overItem.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        const middle = bounding.height / 2;
        const targetIndex = +overItem.dataset.index;
  
        // إزالة أي placeholder موجود
        document.querySelectorAll(".drop-placeholder").forEach(p => p.remove());
  
        const placeholder = document.createElement("li");
        placeholder.className = "drop-placeholder";
        placeholder.style.height = "48px";
        placeholder.style.background = "#dddddd";
        placeholder.style.border = "2px dashed #888";
        placeholder.style.margin = "6px 0";
        placeholder.style.borderRadius = "4px";
  
        placeholder.dataset.insertAt = offset < middle ? targetIndex : targetIndex + 1;
  
        if (offset < middle) {
          list.insertBefore(placeholder, overItem);
        } else {
          list.insertBefore(placeholder, overItem.nextSibling);
        }
      };
    });
  
    // جعل الإفلات يتم على كامل القائمة
    list.ondragover = e => e.preventDefault();
  
    list.ondrop = e => {
        e.preventDefault();
        const placeholder = document.querySelector(".drop-placeholder");
        if (!placeholder || draggedIndex === null) return;
      
        const insertIndex = parseInt(placeholder.dataset.insertAt, 10);
      
        // التحقق من تجاوز آخر عنصر
        const fixedIndex = insertIndex > questions.length ? questions.length : insertIndex;
      
        const movedItem = questions.splice(draggedIndex, 1)[0];
      
        if (fixedIndex > draggedIndex) {
          questions.splice(fixedIndex - 1, 0, movedItem);
        } else {
          questions.splice(fixedIndex, 0, movedItem);
        }
      
        updatePreview();
      };
      
  }
  
  
  
  
  function deleteQuestion(index) {
    if (confirm("❗ هل أنت متأكد أنك تريد حذف هذا السؤال؟")) {
      questions.splice(index, 1);
      updatePreview();
    }
  }
  
  function loadQuestionToForm(index) {
    const q = questions[index];
  
    document.getElementById("title").value = q.title;
    document.getElementById("answer1").value = q.answer_1;
    document.getElementById("answer2").value = q.answer_2;
    document.getElementById("answer3").value = q.answer_3;
    document.getElementById("answer4").value = q.answer_4;
    document.getElementById("score").value = q.score || 1;
  
    // تحديد الإجابة الصحيحة
    const correct = q.right_answer;
    ["answer_1", "answer_2", "answer_3", "answer_4"].forEach((key, i) => {
      const value = q[key];
      if (value === correct) {
        document.getElementById("right_answer").value = key;
      }
    });
  
    // احذف السؤال من القائمة مؤقتًا لتتمكن من حفظ التعديل بعد تغييره
    questions.splice(index, 1);
    updatePreview();
  }
  


// تفريغ الحقول بعد إضافة السؤال
function clearFields() {
  document.getElementById("title").value = "";
  document.getElementById("answer1").value = "";
  document.getElementById("answer2").value = "";
  document.getElementById("answer3").value = "";
  document.getElementById("answer4").value = "";
  document.getElementById("right_answer").selectedIndex = 0;
  document.getElementById("score").value = 1;
}

// إضافة سؤال جديد
function addQuestion() {
  const title = document.getElementById("title").value.trim();
  const a1 = document.getElementById("answer1").value.trim();
  const a2 = document.getElementById("answer2").value.trim();
  const a3 = document.getElementById("answer3").value.trim();
  const a4 = document.getElementById("answer4").value.trim();
  const correctKey = document.getElementById("right_answer").value;
  const score = parseInt(document.getElementById("score").value) || 1;

  if (!title || !a1 || !a2 || !a3 || !a4 || !correctKey) {
    alert("⚠️ يرجى ملء جميع الحقول واختيار الإجابة الصحيحة");
    return;
  }

  let correctAnswer = "";
  switch (correctKey) {
    case "answer_1": correctAnswer = a1; break;
    case "answer_2": correctAnswer = a2; break;
    case "answer_3": correctAnswer = a3; break;
    case "answer_4": correctAnswer = a4; break;
  }

  questions.push({
    title,
    answer_1: a1,
    answer_2: a2,
    answer_3: a3,
    answer_4: a4,
    right_answer: correctAnswer,
    score
  });

  clearFields();
  updatePreview();
  alert(`✅ تم إضافة السؤال - الدرجة: ${score}`);
}

// حفظ التعديلات إلى ملف JSON
function saveCurrentExam() {
  const duration = parseInt(document.getElementById("duration").value) || 10;
  const showAnswers = document.getElementById("showAnswers").value === "true";

  const payload = [
    {
      title: examTitle,
      duration_minutes: duration,
      show_answers: showAnswers
    },
    ...questions
  ];

  fetch(`/exams/${examId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload, null, 2)
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ تم حفظ التعديلات بنجاح!");
      updatePreview();
    })
    .catch(err => {
      console.error("❌ خطأ في الحفظ:", err);
      alert("❌ فشل في حفظ التعديلات");
    });
}
