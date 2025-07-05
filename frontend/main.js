// العناصر
const startScreen = document.querySelector(".start-screen");
const startButton = document.querySelector(".start-button");
const quizInfo = document.querySelector(".quiz-info");
const quizArea = document.querySelector(".quiz-area");
const answersArea = document.querySelector(".answers-area");
const countSpan = document.querySelector(".count span");
const bullets = document.querySelector(".bullets");
const bulletsSpanContainer = document.querySelector(".bullets .spans");
const submitButton = document.querySelector(".submit-button");
const prevButton = document.querySelector(".prev-button");
const resultsContainer = document.querySelector(".results");
const countdownElement = document.querySelector(".countdown");
const buttonControls = document.querySelector(".button-controls");
const namePopup = document.getElementById("namePopup");
const studentNameInput = document.getElementById("studentNameInput");
const submitNameBtn = document.getElementById("submitNameBtn");

let studentName = localStorage.getItem("studentName") || null;
let currentIndex = 0;
let rightAnswers = 0;
let countdownInterval;
let questionsObject = [];
let qCount = 0;
let fullExamDuration = 0;
let savedAnswers = {};
let remainingTime = 0;
let examId = null;
let examStartTime = null;

// ✅ عند التحميل: عرض نافذة الاسم إذا لم يُحفظ
window.onload = () => {
  if (!studentName) {
    namePopup.style.display = "flex";
  } else {
    startScreen.style.display = "block";
  }
};

// ✅ عند الضغط على زر "ابدأ الاختبار"
submitNameBtn.onclick = () => {
  const name = studentNameInput.value.trim();
  if (!name) {
    alert("⚠️ من فضلك أدخل اسمك");
    return;
  }
  studentName = name;
  localStorage.setItem("studentName", name);
  namePopup.style.display = "none";
  startScreen.style.display = "block";
};

// ✅ بدء الامتحان
startButton.onclick = () => {
  examStartTime = Date.now(); // 🕒 بداية الامتحان
  startScreen.style.display = "none";
  quizInfo.style.display = "flex";
  quizArea.style.display = "block";
  answersArea.style.display = "block";
  bullets.style.display = "flex";
  buttonControls.style.display = "flex";
  getQuestions();
};

// ✅ تحميل الأسئلة
function getQuestions() {
  const urlParams = new URLSearchParams(window.location.search);
  examId = urlParams.get("exam") || "1";

  fetch(`exams/${examId}.json`)
  .then(res => res.json())
  .then(data => {
    examMeta = data[0]; // ← هنا نحفظ أول عنصر (المعلومات)
    questionsObject = data.slice(1);

      fullExamDuration = data[0].duration_minutes * 60;
      questionsObject = data.slice(1);
      qCount = questionsObject.length;
      loadFromStorage();
      createBullets(qCount);
      addQuestionData(questionsObject[currentIndex]);
      updateNavButtons();
      startGlobalTimer();
    });
}

// ✅ الرصاصات
function createBullets(num) {
  countSpan.textContent = num;
  bulletsSpanContainer.innerHTML = "";

  for (let i = 0; i < num; i++) {
    const bullet = document.createElement("span");
    bullet.textContent = i + 1;
    bullet.addEventListener("click", () => {
      checkAnswer();
      currentIndex = i;
      addQuestionData(questionsObject[currentIndex]);
      updateNavButtons();
      saveToStorage();
    });
    bulletsSpanContainer.appendChild(bullet);
  }

  handleBullets();
}

// ✅ عرض السؤال الحالي
function addQuestionData(obj) {
  quizArea.innerHTML = "";
  answersArea.innerHTML = "";

  if (!savedAnswers.hasOwnProperty(currentIndex)) {
    savedAnswers[currentIndex] = null;
    saveToStorage();
  }

  const questionTitle = document.createElement("h2");
  questionTitle.textContent = `${currentIndex + 1} - ${obj.title}`;
  quizArea.appendChild(questionTitle);

  for (let i = 1; i <= 4; i++) {
    const div = document.createElement("div");
    div.className = "answer";
    const input = document.createElement("input");
    input.name = "question";
    input.type = "radio";
    input.id = `answer_${i}`;
    input.dataset.answer = obj[`answer_${i}`];

    if (savedAnswers[currentIndex] === obj[`answer_${i}`]) input.checked = true;

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = obj[`answer_${i}`];

    div.appendChild(input);
    div.appendChild(label);
    answersArea.appendChild(div);
  }

  handleBullets();
}

// ✅ التحقق من الإجابة
function checkAnswer() {
  const rAnswer = questionsObject[currentIndex].right_answer;
  const answers = document.getElementsByName("question");
  let chosen = null;

  answers.forEach(el => {
    if (el.checked) {
      chosen = el.dataset.answer;
    }
  });

  if (!savedAnswers.hasOwnProperty(currentIndex)) {
    if (rAnswer === chosen) rightAnswers++;
  } else {
    if (savedAnswers[currentIndex] === rAnswer && chosen !== rAnswer) rightAnswers--;
    if (savedAnswers[currentIndex] !== rAnswer && chosen === rAnswer) rightAnswers++;
  }

  savedAnswers[currentIndex] = chosen || null;
  saveToStorage();
}

// ✅ التنقل
submitButton.onclick = () => {
  checkAnswer();
  currentIndex++;
  if (currentIndex < qCount) {
    addQuestionData(questionsObject[currentIndex]);
    updateNavButtons();
    handleBullets();
    saveToStorage();
  } else {
    clearInterval(countdownInterval);
    clearStorage();
    showResults();
    sendResultToServer();
  }
};

prevButton.onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    addQuestionData(questionsObject[currentIndex]);
    updateNavButtons();
    handleBullets();
    saveToStorage();
  }
};

function updateNavButtons() {
  prevButton.disabled = currentIndex === 0;
}

// ✅ تلوين الرصاصات
function handleBullets() {
  const spans = document.querySelectorAll(".bullets .spans span");
  spans.forEach((span, i) => {
    span.className = "";
    span.style.backgroundColor = "#ddd";
    span.style.color = "#000";
    if (i === currentIndex) span.classList.add("on");
    else if (savedAnswers[i]) {
      span.style.backgroundColor = "#5cb3ff";
      span.style.color = "#fff";
    } else if (i < currentIndex) {
      span.style.backgroundColor = "#dc3545";
      span.style.color = "#fff";
    }
  });
}

// ✅ عرض النتيجة
function showResults() {
  // 🧹 إزالة عناصر الامتحان من الصفحة
  quizArea.remove();
  answersArea.remove();
  submitButton.remove();
  prevButton.remove();
  bullets.remove();
  quizInfo.remove();
  buttonControls.remove();

  // 🧾 حساب الدرجة الكلية
  let studentScore = 0;
  let maxScore = 0;

  for (let i = 0; i < questionsObject.length; i++) {
    const q = questionsObject[i];
    const correct = q.right_answer;
    const studentAnswer = savedAnswers[i];
    const score = parseInt(q.score) || 1;
    maxScore += score;
    if (studentAnswer === correct) studentScore += score;
  }

  // 🕒 حساب الوقت المستخدم
  const durationMs = Date.now() - examStartTime;
  const mins = Math.floor(durationMs / 60000);
  const secs = Math.floor((durationMs % 60000) % 60);
  const timeUsed = `${mins} دقيقة و ${secs} ثانية`;

  // 📊 عرض النتيجة
  resultsContainer.innerHTML = `<h3>✅ نتيجتك يا ${studentName}: ${studentScore} من ${maxScore}</h3>
    <p>⏱️ الوقت المستخدم: ${timeUsed}</p>`;

  // ❌ لو لا يُسمح بالمراجعة
  const showAnswers = examMeta?.show_answers !== false;
  if (!showAnswers) {
    resultsContainer.innerHTML += `<p style="font-weight:bold; margin-top:10px;">حل الامتحان مع معلمك</p>`;
    return;
  }

  // ✅ مراجعة الأسئلة
  for (let i = 0; i < questionsObject.length; i++) {
    const q = questionsObject[i];
    const correctAnswer = q.right_answer;
    const userAnswer = savedAnswers[i] || "—";
    const score = parseInt(q.score) || 1;
    const isCorrect = userAnswer === correctAnswer;

    const box = document.createElement("div");
    box.style.border = "1px solid #ccc";
    box.style.padding = "10px";
    box.style.margin = "10px 0";
    box.style.background = isCorrect ? "#eaffea" : "#ffeaea";

    const title = document.createElement("h4");
    title.textContent = `${i + 1}) ${q.title}`;
    box.appendChild(title);

    for (let j = 1; j <= 4; j++) {
      const val = q[`answer_${j}`];
      const line = document.createElement("div");
      line.textContent = val;
      line.style.padding = "3px 0";

      if (val === correctAnswer) {
        line.style.color = "#007700"; // أخضر للإجابة الصحيحة
        line.style.fontWeight = "bold";
      }

      if (val === userAnswer && val !== correctAnswer) {
        line.style.color = "#cc0000"; // أحمر إن كانت إجابة الطالب خطأ
        line.style.textDecoration = "line-through";
      }

      box.appendChild(line);
    }

    const feedback = document.createElement("p");
    feedback.style.marginTop = "6px";
    feedback.innerHTML = isCorrect
      ? `✅   ${score} من ${score}`
      : `❌  0 من ${score}`;
    box.appendChild(feedback);

    resultsContainer.appendChild(box);
  }
}






let studentScore = 0;
let maxScore = 0;

function checkAnswer() {
  const question = questionsObject[currentIndex];
  const rAnswer = question.right_answer;
  const score = parseInt(question.score) || 1;
  maxScore += score;

  const answers = document.getElementsByName("question");
  let chosen = null;

  answers.forEach(input => {
    if (input.checked) chosen = input.dataset.answer;
  });

  const prev = savedAnswers[currentIndex];
  const wasCorrect = prev === rAnswer;
  const nowCorrect = chosen === rAnswer;

  if (!prev && nowCorrect) studentScore += score;
  else if (prev && wasCorrect && !nowCorrect) studentScore -= score;
  else if (prev && !wasCorrect && nowCorrect) studentScore += score;

  savedAnswers[currentIndex] = chosen || null;
  saveToStorage();
}







// ✅ التايمر
function startGlobalTimer() {
  remainingTime = remainingTime || fullExamDuration;

  countdownInterval = setInterval(() => {
    const mins = Math.floor(remainingTime / 60);
    const secs = remainingTime % 60;

    countdownElement.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    remainingTime--;

    localStorage.setItem("remainingTime", remainingTime);

    if (remainingTime < 0) {
      clearInterval(countdownInterval);
      clearStorage();
      showResults();
      sendResultToServer();
    }
  }, 1000);
}

// ✅ التخزين
function saveToStorage() {
  localStorage.setItem("quizCurrentIndex", currentIndex);
  localStorage.setItem("quizAnswers", JSON.stringify(savedAnswers));
  localStorage.setItem("quizRightAnswers", rightAnswers);
}

function loadFromStorage() {
  currentIndex = +localStorage.getItem("quizCurrentIndex") || 0;
  remainingTime = +localStorage.getItem("remainingTime") || fullExamDuration;
  savedAnswers = JSON.parse(localStorage.getItem("quizAnswers")) || {};
  rightAnswers = +localStorage.getItem("quizRightAnswers") || 0;
}

function clearStorage() {
  localStorage.removeItem("quizCurrentIndex");
  localStorage.removeItem("quizAnswers");
  localStorage.removeItem("quizRightAnswers");
  localStorage.removeItem("remainingTime");
}

// ✅ إرسال النتيجة للسيرفر
function sendResultToServer() {
  const now = Date.now();
  const durationUsed = fullExamDuration - remainingTime;
  const durationUsedMs = now - examStartTime;
  const mins = Math.floor(durationUsedMs / 60000);
  const secs = Math.floor((durationUsedMs % 60000) / 1000);
  const durationDisplay = `${mins} دقيقة و ${secs} ثانية`;

  fetch(`/results/${examId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: studentName || "طالب مجهول",
      score: studentScore,
      timestamp: new Date(now).toISOString(),
      duration_seconds: durationUsed,
      duration_display: durationDisplay
    })
  });
}

