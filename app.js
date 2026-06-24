let BIOLOGY_DATA = {
  knowledge: [],
  quizzes: { 10: [], 11: [], 12: [] },
  infographics: [],
  outlines: [],
  mockExam: []
};

// State variables
let userProgress = JSON.parse(localStorage.getItem("bio_hub_progress")) || {
  10: 0,
  11: 0,
  12: 0
};

let currentView = "home";
let activeQuizGrade = 10;
let activeQuizIndex = 0;
let mockExamAnswers = Array(40).fill(null);
let mockExamTimer = null;
let mockExamSecondsLeft = 50 * 60;

// On Load
document.addEventListener("DOMContentLoaded", () => {
  loadDatabase();
});

// Load external JSON database
async function loadDatabase() {
  try {
    const response = await fetch("database.json");
    if (!response.ok) throw new Error("Không thể tải cơ sở dữ liệu");
    const data = await response.json();
    
    BIOLOGY_DATA.knowledge = data.knowledge || [];
    BIOLOGY_DATA.quizzes = data.quizzes || { 10: [], 11: [], 12: [] };
    BIOLOGY_DATA.infographics = data.infographics || [];
    BIOLOGY_DATA.outlines = data.outlines || [];
    BIOLOGY_DATA.mockExam = data.mockExam || [];

    // Dynamically expand Mock Exam to 40 questions if necessary
    expandMockQuestions();

    initApp();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu bài học:", error);
    alert("Không thể kết nối đến cơ sở dữ liệu bài học. Đang sử dụng chế độ ngoại tuyến.");
  }
}

function expandMockQuestions() {
  while (BIOLOGY_DATA.mockExam.length < 40 && BIOLOGY_DATA.mockExam.length > 0) {
    const currentLength = BIOLOGY_DATA.mockExam.length;
    const templates = [
      {
        q: `Câu ${currentLength + 1}: Hiện tượng gen đa hiệu xảy ra khi?`,
        options: ["A. Một gen chi phối sự biểu hiện của nhiều tính trạng", "B. Nhiều gen cùng tác động tạo ra một tính trạng", "C. Tương tác bổ sung của các gen", "D. Sự di truyền liên kết với giới tính"],
        correct: 0,
        solution: "Gen đa hiệu là gen có thể tác động đến sự biểu hiện của nhiều tính trạng khác nhau."
      },
      {
        q: `Câu ${currentLength + 1}: Mối quan hệ hợp tác giữa chim sáo và trâu rừng thuộc loại quan hệ?`,
        options: ["A. Cộng sinh", "B. Hợp tác (không bắt buộc)", "C. Ký sinh", "D. Hội sinh"],
        correct: 1,
        solution: "Quan hệ hợp tác đem lại lợi ích cho cả hai bên nhưng không phải là mối quan hệ bắt buộc để sinh tồn."
      },
      {
        q: `Câu ${currentLength + 1}: Cơ quan tương đồng là những cơ quan có?`,
        options: ["A. Cùng nguồn gốc tiến hóa, chức năng hiện tại có thể khác nhau", "B. Khác nguồn gốc tiến hóa, chức năng hoàn toàn giống nhau", "C. Nguồn gốc khác nhau và không còn chức năng gì", "D. Cấu tạo hoàn toàn khác biệt"],
        correct: 0,
        solution: "Cơ quan tương đồng phản ánh nguồn gốc chung của các loài dù hiện tại chức năng biến đổi để thích nghi."
      },
      {
        q: `Câu ${currentLength + 1}: Loại đột biến NST nào làm thay đổi nhóm gen liên kết?`,
        options: ["A. Lặp đoạn NST", "B. Mất đoạn NST", "C. Đảo đoạn NST", "D. Chuyển đoạn tương hỗ hoặc không tương hỗ"],
        correct: 3,
        solution: "Chuyển đoạn giữa các NST khác nhau làm chuyển dời gen từ nhóm liên kết này sang nhóm liên kết khác."
      }
    ];
    const template = templates[currentLength % templates.length];
    BIOLOGY_DATA.mockExam.push(template);
  }
}

function initApp() {
  // Navigation Event Listeners
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = link.getAttribute("data-view");
      navigateTo(targetView);
    });
  });

  // Mobile menu toggle
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  // Theme Toggle
  const themeToggle = document.querySelector(".btn-theme-toggle");
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    themeToggle.innerHTML = newTheme === "dark" 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>` 
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  });

  // Search Engine logic
  const searchInput = document.querySelector(".search-bar");
  const suggestionsBox = document.querySelector(".search-suggestions");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      suggestionsBox.style.display = "none";
      return;
    }

    const matches = BIOLOGY_DATA.knowledge.filter(k => 
      k.title.toLowerCase().includes(query) || 
      k.summary.toLowerCase().includes(query)
    );

    suggestionsBox.innerHTML = "";
    if (matches.length > 0) {
      matches.forEach(match => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = `[Lớp ${match.grade}] ${match.title}`;
        item.addEventListener("click", () => {
          navigateTo("knowledge");
          openKnowledgeCard(match.id);
          suggestionsBox.style.display = "none";
          searchInput.value = "";
        });
        suggestionsBox.appendChild(item);
      });
      suggestionsBox.style.display = "block";
    } else {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = "Không tìm thấy nội dung liên quan";
      suggestionsBox.appendChild(item);
      suggestionsBox.style.display = "block";
    }
  });

  // Close search suggestions on click outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = "none";
    }
  });

  // Set up initial pages & dynamic renderers
  renderHome();
  renderKnowledge();
  renderExercises();
  renderInfographics();
  renderOutlines();
  renderMockExam();
}

function navigateTo(viewId) {
  document.querySelector(".nav-menu").classList.remove("active");

  document.querySelectorAll(".section-container").forEach(section => {
    section.classList.remove("active-view");
  });
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add("active-view");
  }

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("data-view") === viewId) {
      link.classList.add("active");
    }
  });

  currentView = viewId;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProgress(grade, newPercent) {
  userProgress[grade] = Math.max(userProgress[grade], newPercent);
  localStorage.setItem("bio_hub_progress", JSON.stringify(userProgress));
  renderHome();
  renderExercises();
}

// 1. Render Home / Dashboards
function renderHome() {
  const avgProgress = Math.round((userProgress[10] + userProgress[11] + userProgress[12]) / 3);
  const homeProgressEl = document.getElementById("home-progress");
  if (homeProgressEl) {
    homeProgressEl.innerHTML = `
      <div class="progress-widget">
        <div class="quick-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="progress-widget-info">
          <h4>Tiến trình học tập tổng quan</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Bạn đã hoàn thành các câu hỏi trắc nghiệm tự luyện tập.</p>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${avgProgress}%"></div>
          </div>
        </div>
        <span style="font-weight: 800; font-size: 1.5rem; color: var(--primary-600);">${avgProgress}%</span>
      </div>
    `;
  }
}

// 2. Render Knowledge Library
function renderKnowledge() {
  const knowledgeTabs = document.getElementById("knowledge-tabs");
  const knowledgeGrid = document.getElementById("knowledge-list-grid");

  const themesMap = {
    cellular: "Tế bào học & Sinh học Vi sinh",
    genetics: "Di truyền học & Sinh học cơ thể",
    evolution: "Tiến hóa học",
    ecology: "Sinh thái học"
  };

  const renderGrade = (grade) => {
    knowledgeGrid.innerHTML = "";
    const items = BIOLOGY_DATA.knowledge.filter(k => k.grade === grade);

    if (items.length === 0) {
      knowledgeGrid.innerHTML = "<p>Nội dung đang được cập nhật...</p>";
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "concept-card";
      card.id = `card-${item.id}`;
      card.innerHTML = `
        <div class="concept-header">
          <div>
            <span class="badge-tag badge-final" style="margin-bottom: 0.5rem;">${themesMap[item.theme] || item.theme}</span>
            <h4>${item.title}</h4>
          </div>
          <div class="concept-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="concept-body">
          <p><strong>Khái quát:</strong> ${item.summary}</p>
          <ul class="concept-bullets">
            ${item.bullets.map(b => `<li>${b}</li>`).join("")}
          </ul>
        </div>
      `;

      card.querySelector(".concept-header").addEventListener("click", () => {
        card.classList.toggle("expanded");
      });

      knowledgeGrid.appendChild(card);
    });
  };

  knowledgeTabs.innerHTML = `
    <button class="tab-btn active" data-grade="10">Sinh học 10</button>
    <button class="tab-btn" data-grade="11">Sinh học 11</button>
    <button class="tab-btn" data-grade="12">Sinh học 12</button>
  `;

  knowledgeTabs.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      knowledgeTabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderGrade(parseInt(btn.getAttribute("data-grade")));
    });
  });

  renderGrade(10);
}

function openKnowledgeCard(id) {
  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("expanded");
  }
}

// 3. Render Practice Exercises & Interactive Quiz
function renderExercises() {
  const exerciseGrid = document.getElementById("exercise-grades-grid");
  if (!exerciseGrid) return;

  exerciseGrid.innerHTML = "";
  [10, 11, 12].forEach(grade => {
    const totalQuizzes = (BIOLOGY_DATA.quizzes[grade] || []).length;
    const progressVal = userProgress[grade];
    
    const card = document.createElement("div");
    card.className = "exercise-card";
    card.innerHTML = `
      <h3>Sinh học lớp ${grade}</h3>
      <div class="progress-container">
        <div class="progress-bar" style="width: ${progressVal}%"></div>
      </div>
      <div class="exercise-meta">
        <span>Tiến trình hoàn thành: ${progressVal}%</span>
        <span>Bộ câu hỏi trắc nghiệm</span>
      </div>
      <button class="btn-primary" onclick="startQuiz(${grade})" ${totalQuizzes === 0 ? "disabled" : ""}>
        ${totalQuizzes === 0 ? "Đang cập nhật" : "Luyện tập ngay"}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    `;
    exerciseGrid.appendChild(card);
  });
}

function startQuiz(grade) {
  activeQuizGrade = grade;
  activeQuizIndex = 0;
  showQuizQuestion();
  document.getElementById("quiz-modal").classList.add("active");
}

function closeQuiz() {
  document.getElementById("quiz-modal").classList.remove("active");
}

function showQuizQuestion() {
  const quizzes = BIOLOGY_DATA.quizzes[activeQuizGrade] || [];
  const q = quizzes[activeQuizIndex];
  if (!q) return;
  
  const content = document.getElementById("quiz-modal-content");
  content.innerHTML = `
    <button class="modal-close" onclick="closeQuiz()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="quiz-header">
      <span class="badge-tag badge-mid">Sinh học ${activeQuizGrade}</span>
      <span style="float: right; font-weight: 600;">Câu ${activeQuizIndex + 1}/${quizzes.length}</span>
    </div>
    <div class="quiz-question">${q.question}</div>
    <div class="options-list">
      ${q.options.map((opt, idx) => `
        <button class="option-btn" onclick="selectQuizOption(${idx})">
          <span class="bubble-letter" style="font-weight:700;">${String.fromCharCode(65 + idx)}.</span>
          <span>${opt}</span>
        </button>
      `).join("")}
    </div>
    <div class="quiz-explanation" id="quiz-explain">
      <strong>Giải thích chi tiết:</strong><br>${q.explanation}
    </div>
    <div class="quiz-footer">
      <span style="font-size: 0.9rem; color: var(--text-muted);">Chọn đáp án để xem lời giải ngay</span>
      <button class="btn-primary" id="quiz-next-btn" style="display: none;" onclick="nextQuizQuestion()">
        Tiếp theo
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </div>
  `;
}

function selectQuizOption(index) {
  const quizzes = BIOLOGY_DATA.quizzes[activeQuizGrade];
  const q = quizzes[activeQuizIndex];
  const options = document.querySelectorAll(".option-btn");

  options.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) {
      btn.classList.add("correct");
    } else if (idx === index) {
      btn.classList.add("incorrect");
    }
  });

  document.getElementById("quiz-explain").style.display = "block";
  document.getElementById("quiz-next-btn").style.display = "inline-flex";

  if (index === q.correct) {
    const stepWeight = 100 / quizzes.length;
    const currentProgress = userProgress[activeQuizGrade];
    const newProgress = Math.min(100, Math.round(currentProgress + stepWeight));
    updateProgress(activeQuizGrade, newProgress);
  }
}

function nextQuizQuestion() {
  const quizzes = BIOLOGY_DATA.quizzes[activeQuizGrade];
  activeQuizIndex++;
  if (activeQuizIndex < quizzes.length) {
    showQuizQuestion();
  } else {
    updateProgress(activeQuizGrade, 100);
    const content = document.getElementById("quiz-modal-content");
    content.innerHTML = `
      <button class="modal-close" onclick="closeQuiz()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div style="text-align: center; padding: 2rem 0;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="margin-bottom: 1.5rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <h3>Chúc mừng bạn đã hoàn thành!</h3>
        <p style="color: var(--text-muted); margin: 1rem 0;">Bạn đã vượt qua bài luyện tập trắc nghiệm lớp ${activeQuizGrade} xuất sắc.</p>
        <button class="btn-primary" onclick="closeQuiz()">Đóng bảng</button>
      </div>
    `;
  }
}

// 4. Render Infographics & Lightbox
function renderInfographics() {
  const grid = document.getElementById("infographics-grid");
  if (!grid) return;

  grid.innerHTML = "";
  if (BIOLOGY_DATA.infographics.length === 0) {
    grid.innerHTML = "<p>Nội dung đang được cập nhật...</p>";
    return;
  }

  BIOLOGY_DATA.infographics.forEach((info, idx) => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <div class="info-media-wrapper" onclick="openLightbox(${idx})">
        ${info.svg}
        <div class="info-hover-overlay">
          <button class="btn-zoom">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
        </div>
      </div>
      <div class="info-info">
        <div>
          <h3>${info.title}</h3>
          <p>${info.desc}</p>
        </div>
        <button class="btn-primary" style="margin-top: 1rem; width:100%;" onclick="downloadInfographic(${idx})">
          Tải file chất lượng cao (SVG)
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openLightbox(index) {
  const info = BIOLOGY_DATA.infographics[index];
  const lightbox = document.getElementById("lightbox-modal");
  const lightboxContent = document.getElementById("lightbox-modal-content");

  lightboxContent.innerHTML = `
    <button class="modal-close" onclick="closeLightbox()" style="color: white;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="lightbox-img-wrapper">
      ${info.svg}
    </div>
    <div style="text-align: center; color: white;">
      <h3>${info.title}</h3>
      <p style="opacity: 0.8; font-size: 0.9rem; margin-top: 0.3rem;">${info.desc}</p>
      <button class="btn-primary" style="margin-top: 1rem;" onclick="downloadInfographic(${index})">
        Tải xuống
      </button>
    </div>
  `;

  lightbox.classList.add("active");
}

function closeLightbox() {
  document.getElementById("lightbox-modal").classList.remove("active");
}

function downloadInfographic(index) {
  const info = BIOLOGY_DATA.infographics[index];
  const blob = new Blob([info.svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${info.title.toLowerCase().replace(/[\s\(\)]+/g, "-")}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 5. Render Study Guides & Search
function renderOutlines() {
  const tbody = document.getElementById("outlines-table-body");
  const searchInput = document.getElementById("outline-search");

  const drawTable = (filterText = "") => {
    tbody.innerHTML = "";
    const filtered = BIOLOGY_DATA.outlines.filter(o => 
      o.title.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Không tìm thấy đề cương nào</td></tr>`;
      return;
    }

    filtered.forEach(o => {
      let badgeClass = "badge-mid";
      if (o.term === "Cuối kỳ") badgeClass = "badge-final";
      if (o.term === "THPT Quốc gia") badgeClass = "badge-national";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong style="font-size: 0.95rem;">${o.title}</strong></td>
        <td>Lớp ${o.grade}</td>
        <td><span class="badge-tag ${badgeClass}">${o.term}</span></td>
        <td>
          <a href="#" class="btn-download-outline" onclick="alert('Bắt đầu tải file đề cương: ${o.title}'); return false;">
            Tải PDF
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  searchInput.addEventListener("input", (e) => {
    drawTable(e.target.value);
  });

  drawTable();
}

// 6. Mock Graduation Exam Simulator
function renderMockExam() {
  const container = document.getElementById("mock-exam-container");
  if (!container) return;

  if (BIOLOGY_DATA.mockExam.length === 0) {
    container.innerHTML = "<p style='text-align:center; padding: 2rem;'>Nội dung đề thi thử đang được chuẩn bị...</p>";
    return;
  }

  container.innerHTML = `
    <div style="text-align:center; max-width: 600px; margin: 4rem auto;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="2" style="margin-bottom: 1.5rem;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <h2>Trình giả lập thi tốt nghiệp THPT Quốc gia</h2>
      <p style="color: var(--text-muted); margin: 1rem 0 2rem;">Trải nghiệm đề thi mô phỏng đúng chuẩn cấu trúc thi tốt nghiệp THPT Bộ GD&amp;ĐT gồm 40 câu trắc nghiệm làm trong thời gian 50 phút.</p>
      <button class="btn-primary" onclick="startMockExam()">
        Bắt đầu làm bài (50 Phút)
      </button>
    </div>
  `;
}

function startMockExam() {
  mockExamAnswers = Array(40).fill(null);
  mockExamSecondsLeft = 50 * 60;

  const container = document.getElementById("mock-exam-container");
  container.innerHTML = `
    <div class="simulator-layout">
      <div class="simulator-questions-panel" id="sim-questions-list">
        <!-- Questions will be drawn here -->
      </div>
      
      <div class="simulator-sidebar">
        <div class="widget-card">
          <h4>Thời gian còn lại</h4>
          <div class="timer-display" id="sim-timer">50:00</div>
        </div>

        <div class="widget-card">
          <h4>Phiếu trả lời trắc nghiệm</h4>
          <div class="bubble-grid" id="sim-bubbles"></div>
          <button class="btn-primary" style="width: 100%; margin-top: 1.5rem; background-color: var(--accent);" onclick="submitMockExam()">
            Nộp bài thi
          </button>
        </div>
      </div>
    </div>
  `;

  const bubbleContainer = document.getElementById("sim-bubbles");
  for (let i = 0; i < 40; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.id = `bubble-${i}`;
    bubble.textContent = i + 1;
    bubble.addEventListener("click", () => {
      document.getElementById(`sim-q-${i}`).scrollIntoView({ behavior: "smooth", block: "center" });
    });
    bubbleContainer.appendChild(bubble);
  }

  const questionsContainer = document.getElementById("sim-questions-list");
  BIOLOGY_DATA.mockExam.forEach((item, idx) => {
    const qBlock = document.createElement("div");
    qBlock.className = "sim-question-block";
    qBlock.id = `sim-q-${idx}`;
    qBlock.innerHTML = `
      <div class="sim-q-title">${item.q}</div>
      <div class="sim-options">
        ${item.options.map((opt, optIdx) => `
          <label class="sim-option-label" id="label-q${idx}-${optIdx}">
            <input type="radio" name="q-${idx}" value="${optIdx}" onclick="answerMockQuestion(${idx}, ${optIdx})">
            <span>${opt}</span>
          </label>
        `).join("")}
      </div>
    `;
    questionsContainer.appendChild(qBlock);
  });

  if (mockExamTimer) clearInterval(mockExamTimer);
  mockExamTimer = setInterval(() => {
    mockExamSecondsLeft--;
    if (mockExamSecondsLeft <= 0) {
      clearInterval(mockExamTimer);
      submitMockExam();
    } else {
      const mins = Math.floor(mockExamSecondsLeft / 60).toString().padStart(2, "0");
      const secs = (mockExamSecondsLeft % 60).toString().padStart(2, "0");
      document.getElementById("sim-timer").textContent = `${mins}:${secs}`;
    }
  }, 1000);
}

function answerMockQuestion(questionIndex, optionIndex) {
  mockExamAnswers[questionIndex] = optionIndex;
  
  for (let i = 0; i < 4; i++) {
    const label = document.getElementById(`label-q${questionIndex}-${i}`);
    if (label) {
      label.classList.remove("checked-label");
    }
  }
  document.getElementById(`label-q${questionIndex}-${optionIndex}`).classList.add("checked-label");

  const bubble = document.getElementById(`bubble-${questionIndex}`);
  if (bubble) {
    bubble.classList.add("answered");
  }
}

function submitMockExam() {
  clearInterval(mockExamTimer);

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  BIOLOGY_DATA.mockExam.forEach((item, idx) => {
    if (mockExamAnswers[idx] === item.correct) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  score = (correctCount * 10) / 40;

  const container = document.getElementById("mock-exam-container");
  container.innerHTML = `
    <div class="score-card widget-card">
      <h2>Kết quả bài thi thử</h2>
      <div class="score-value">${score.toFixed(2)} / 10</div>
      <div class="score-stats">
        <div class="stat-item correct">
          <span>${correctCount}</span> Câu đúng
        </div>
        <div class="stat-item incorrect">
          <span>${incorrectCount}</span> Câu sai/trống
        </div>
      </div>
      <button class="btn-primary" onclick="startMockExam()">Thi lại</button>
      <button class="btn-primary" style="background-color: var(--secondary); margin-left: 1rem;" onclick="renderMockExam()">Về trang chính</button>
      
      <div class="review-question-list">
        <h3>Xem lại chi tiết đáp án &amp; lời giải:</h3>
        ${BIOLOGY_DATA.mockExam.map((item, idx) => {
          const isCorrect = mockExamAnswers[idx] === item.correct;
          const userAnsText = mockExamAnswers[idx] !== null 
            ? item.options[mockExamAnswers[idx]] 
            : "Chưa chọn đáp án";
          return `
            <div class="review-item ${isCorrect ? "is-correct" : "is-incorrect"}">
              <div class="sim-q-title" style="margin-bottom:0.5rem;">${item.q}</div>
              <p><strong>Đáp án của bạn:</strong> <span style="${isCorrect ? "color:var(--primary-600);" : "color:var(--accent);"}" >${userAnsText}</span></p>
              <p><strong>Đáp án chính xác:</strong> <span style="color:var(--primary-600);">${item.options[item.correct]}</span></p>
              <div class="review-explain">
                <strong>Giải chi tiết:</strong> ${item.solution}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
