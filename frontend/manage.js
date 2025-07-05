
function loadExamList() {
    fetch("/exams")
      .then(res => res.json())
      .then(exams => {
        const list = exams.map(id => `
          <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
            <input id="title-${id}" placeholder="اسم الاختبار..." />
            <button onclick="saveTitle(${id})">💾 حفظ الاسم</button>
            <button onclick="goToEdit(${id})">✏️ تعديل</button>
            <button onclick="deleteExam(${id})">🗑️ حذف</button>
            <button onclick="copyLink(${id})">🔗 نسخ الرابط</button>
            <button onclick="goToResults(${id})">📊 عرض النتائج</button>


          </div>
        `).join("");
        document.getElementById("examList").innerHTML = list;
  
        exams.forEach(id => {
          fetch(`/exams/${id}`)
            .then(res => res.json())
            .then(data => {
              const title = data[0]?.title || `اختبار ${id}`;
              document.getElementById(`title-${id}`).value = title;
            });
        });
      });
  }
  
  function saveTitle(id) {
    const newTitle = document.getElementById(`title-${id}`).value;
    fetch(`/exams/${id}/title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "✅ تم تعديل الاسم");
      });
  }
  
  function createNewExam() {
    fetch("/exams/create", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        loadExamList();
      });
  }
  
  function deleteExam(id) {
    if (confirm("❌ هل تريد حذف هذا الامتحان؟")) {
      fetch(`/exams/${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          loadExamList();
        });
    }
  }
  
  function goToEdit(id) {
    window.location.href = `admin.html?exam=${id}`;
  }
  
  function copyLink(id) {
    const domain = window.location.origin;
    const link = `${domain}/index.html?exam=${id}`;
  
    navigator.clipboard.writeText(link)
      .then(() => alert(`📋 تم نسخ الرابط: ${link}`))
      .catch(() => alert("❌ لم يتم النسخ"));
  }
  
  window.onload = loadExamList;
  
  function goToResults(id) {
    window.location.href = `results.html?exam=${id}`;
  }

 
  
  function deleteExam(id) {
    if (confirm(`❌ هل تريد فعلاً حذف الامتحان رقم ${id} ونتائجه؟`)) {
      fetch(`/exams/${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "✅ تم الحذف بنجاح!");
          loadExamList(); // لو عندك قائمة تتحدث
        })
        .catch(err => {
          console.error(err);
          alert("❌ حدث خطأ أثناء الحذف.");
        });
    }
  }
    
