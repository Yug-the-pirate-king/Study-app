const SUBJECT_CATALOG = {
  "Engineering Mathematics-III": {
    credits: 3,
    chapters: [
      "Laplace Transforms",
      "Fourier Series",
      "Partial Differential Equations",
      "Z-Transforms",
      "Functions of Complex Variables"
    ]
  },
  "Data Structures": {
    credits: 3,
    chapters: [
      "Data, Data types, Arrays and Hash Tables",
      "Stacks and Queues",
      "Linked Lists",
      "Trees and Graphs",
      "Searching and Sorting"
    ]
  },
  "Discrete Mathematics": {
    credits: 3,
    chapters: [
      "Propositional Logic and Predicates",
      "Set Theory, Functions and Relations",
      "Combinatorics",
      "Graph Theory and Trees",
      "Algebraic Structures"
    ]
  },
  "Object-Oriented Programming": {
    credits: 2,
    chapters: [
      "Introduction to Classes and Objects",
      "Control Statements and Arrays",
      "Inheritance and Polymorphism",
      "Exception Handling"
    ]
  },
  "Digital Electronics": {
    credits: 2,
    chapters: [
      "Introduction and Logic Gates",
      "Number Systems",
      "Combinational Logic Design",
      "Design Examples and Circuits",
      "Sequential Circuits and Systems"
    ]
  },
  "Universal Human Values - II": {
    credits: 2,
    chapters: [
      "Introduction to Value Education",
      "Harmony in the Human Being",
      "Harmony in the Family and Society",
      "Harmony in Nature",
      "Professional Ethics and Applications"
    ]
  }
};

const GRADE_SCALE = {
  "EX": { min: 91, points: 10 },
  "AA`": { min: 86, points: 9 },
  "AB": { min: 81, points: 8 },
  "BB": { min: 76, points: 7 },
  "BC": { min: 71, points: 6 },
  "CC": { min: 66, points: 5 },
  "CD": { min: 61, points: 4 },
  "DD": { min: 56, points: 0 },
  "DE": { min: 51, points: 0 },
  "EE": { min: 40, points: 0 },
  "EF": { min: 0, points: 0 }
};

const GRADE_SCALE_ENTRIES = Object.entries(GRADE_SCALE);

let studySchedule = [];
let folders = {};
let subjectMarks = {};

const getElement = (id) => document.getElementById(id);
const getTotalChapters = () => Object.values(SUBJECT_CATALOG).reduce((sum, subject) => sum + subject.chapters.length, 0);
const toISODate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const formatDate = (date) => date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

function getGradeInfo(percentage) {
  for (const [grade, data] of GRADE_SCALE_ENTRIES) {
    if (percentage >= data.min) {
      return { grade, points: data.points };
    }
  }
  return { grade: "F", points: 0 };
}

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  populateSubjectSelectors();
  initializeFolderStructure();
  calculateModeDurations();
});

function initializeApp() {
  const today = new Date();
  const startDate = addDays(today, 7);
  const examDate = addDays(today, 90);
  const startDateInput = getElement("startDate");
  const examDateInput = getElement("examDate");

  if (startDateInput && examDateInput) {
    startDateInput.value = toISODate(startDate);
    examDateInput.value = toISODate(examDate);
  }

  Object.keys(SUBJECT_CATALOG).forEach((subjectName) => {
    subjectMarks[subjectName] = { ct1: 0, ct2: 0, assignment: 0, midSem: 0, endSem: 0 };
  });
}

function setupEventListeners() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      switchTab(tab.dataset.tab);
    });
  });

  getElement("generatePlan")?.addEventListener("click", (event) => {
    event.preventDefault();
    generateStudyPlan();
  });

  getElement("addMaterial")?.addEventListener("click", (event) => {
    event.preventDefault();
    showAddMaterialModal();
  });

  getElement("searchMaterials")?.addEventListener("input", searchMaterials);

  getElement("calculateCGPA")?.addEventListener("click", (event) => {
    event.preventDefault();
    calculateCGPA();
  });

  getElement("subjectSelect")?.addEventListener("change", loadSubjectMarks);

  document.querySelectorAll(".mode-select").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      selectPerformanceMode(button.dataset.mode);
    });
  });

  getElement("cancelMaterial")?.addEventListener("click", (event) => {
    event.preventDefault();
    hideAddMaterialModal();
  });

  getElement("saveMaterial")?.addEventListener("click", (event) => {
    event.preventDefault();
    saveMaterial();
  });

  document.querySelector(".modal-close")?.addEventListener("click", (event) => {
    event.preventDefault();
    hideAddMaterialModal();
  });

  getElement("materialSubject")?.addEventListener("change", updateMaterialChapters);

  getElement("folderStructure")?.addEventListener("click", handleFolderToggle);
  getElement("folderStructure")?.addEventListener("click", handleRemoveMaterialClick);
  getElement("planDetails")?.addEventListener("change", handlePlanCheckboxChange);
}

function switchTab(tabId) {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-content").forEach((content) => {
    const isTarget = content.id === tabId;
    content.classList.toggle("active", isTarget);
    content.style.display = isTarget ? "block" : "none";
  });
}

function generateStudyPlan() {
  const modeSelect = getElement("studyMode");
  const startDateInput = getElement("startDate");
  const examDateInput = getElement("examDate");

  if (!modeSelect || !startDateInput || !examDateInput) return;

  const mode = modeSelect.value;
  const startDate = new Date(startDateInput.value);
  const examDate = new Date(examDateInput.value);

  if (!startDateInput.value || !examDateInput.value || examDate <= startDate) {
    alert("Please select valid start and exam dates");
    return;
  }

  studySchedule = createStudyPlan(mode, startDate, examDate);
  displayStudyPlan();

  const output = getElement("studyPlanOutput");
  if (output) {
    output.classList.remove("hidden");
    output.classList.add("fade-in");
  }
}

function createStudyPlan(mode, startDate, examDate) {
  const plan = [];
  const subjectList = Object.entries(SUBJECT_CATALOG).sort((a, b) => b[1].credits - a[1].credits);

  if (mode === "intense") {
    const intenseDays = 7;
    const totalChapters = getTotalChapters();
    const chaptersPerDay = Math.ceil(totalChapters / intenseDays);
    let currentDate = addDays(examDate, -intenseDays);

    let chapterIndex = 0;
    let currentSubjectIndex = 0;

    for (let day = 0; day < intenseDays; day++) {
      const dayPlan = { date: new Date(currentDate), subjects: [] };
      let chaptersToday = 0;

      while (chaptersToday < chaptersPerDay && currentSubjectIndex < subjectList.length) {
        const [subjectName, subject] = subjectList[currentSubjectIndex];

        if (chapterIndex < subject.chapters.length) {
          dayPlan.subjects.push({
            subject: subjectName,
            chapter: subject.chapters[chapterIndex],
            priority: subject.credits >= 3 ? "high" : "medium"
          });
          chapterIndex++;
          chaptersToday++;
        }

        if (chapterIndex >= subject.chapters.length) {
          currentSubjectIndex++;
          chapterIndex = 0;
        }
      }

      if (dayPlan.subjects.length > 0) {
        plan.push(dayPlan);
      }

      currentDate = addDays(currentDate, 1);
    }
  } else {
    const chaptersPerDay = mode === "easy" ? 1 : 2;
    const daysBetween = Math.ceil((examDate - startDate) / (1000 * 60 * 60 * 24));
    const allChapters = [];

    subjectList.forEach(([subjectName, subject]) => {
      subject.chapters.forEach((chapter) => {
        allChapters.push({
          subject: subjectName,
          chapter,
          priority: subject.credits >= 3 ? "high" : subject.credits === 2 ? "medium" : "low"
        });
      });
    });

    let currentDate = new Date(startDate);
    let chapterPointer = 0;

    for (let day = 0; day < daysBetween && chapterPointer < allChapters.length; day++) {
      const dayPlan = { date: new Date(currentDate), subjects: [] };

      for (let i = 0; i < chaptersPerDay && chapterPointer < allChapters.length; i++) {
        dayPlan.subjects.push(allChapters[chapterPointer++]);
      }

      if (dayPlan.subjects.length > 0) {
        plan.push(dayPlan);
      }

      currentDate = addDays(currentDate, 1);
    }
  }

  return plan;
}

function displayStudyPlan() {
  const planDetails = getElement("planDetails");
  if (!planDetails) return;

  planDetails.innerHTML = studySchedule
    .map(
      (day, index) => `
        <div class="plan-day">
          <input type="checkbox" id="day-${index}">
          <div class="plan-day-info">
            <div class="plan-date">${formatDate(day.date)}</div>
            <div class="plan-subjects">
              ${day.subjects
                .map(
                  (item) =>
                    `<span class="status-badge status-badge--${item.priority}-priority">${item.subject}</span> ${item.chapter}`
                )
                .join(" • ")}
            </div>
          </div>
        </div>
      `
    )
    .join("");

  updateProgressDisplay();
}

function handlePlanCheckboxChange(event) {
  if (event.target.tagName !== "INPUT" || event.target.type !== "checkbox") return;

  const dayElement = event.target.closest(".plan-day");
  if (dayElement) {
    dayElement.classList.toggle("completed", event.target.checked);
  }

  updateProgressDisplay();
}

function updateProgressDisplay() {
  const completedDays = document.querySelectorAll(".plan-day input:checked").length;
  const totalDays = studySchedule.length;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  getElement("overallProgress")?.style.setProperty("width", `${progress}%`);

  const progressText = getElement("progressText");
  if (progressText) {
    progressText.textContent = `${Math.round(progress)}% Complete`;
  }
}

function initializeFolderStructure() {
  folders = {};

  Object.entries(SUBJECT_CATALOG).forEach(([subjectName, subject]) => {
    const chapters = {};

    subject.chapters.forEach((chapterName, index) => {
      chapters[index] = { name: chapterName, materials: [] };
    });

    folders[subjectName] = { chapters, materials: [] };
  });

  renderFolderStructure();
}

function renderFolderStructure() {
  const container = getElement("folderStructure");
  if (!container) return;

  container.innerHTML = Object.entries(folders)
    .map(([subjectName, subjectData]) => {
      const chapterList = Object.values(subjectData.chapters);
      const totalMaterials =
        subjectData.materials.length +
        chapterList.reduce((sum, chapter) => sum + chapter.materials.length, 0);

      return `
        <div class="folder-item">
          <div class="folder-header" data-toggle="folder" data-subject="${subjectName}">
            <span class="folder-icon">📁</span>
            <span class="folder-name">${subjectName}</span>
            <span class="material-count">(${totalMaterials} materials)</span>
          </div>
          <div class="folder-children" id="folder-${subjectName}">
            ${Object.entries(subjectData.chapters)
              .map(
                ([chapterIndex, chapter]) => `
                  <div class="folder-item">
                    <div class="folder-header" data-toggle="chapter" data-subject="${subjectName}" data-chapter="${chapterIndex}">
                      <span class="folder-icon">📄</span>
                      <span class="folder-name">${escapeHtml(chapter.name)}</span>
                      <span class="material-count">(${chapter.materials.length} materials)</span>
                    </div>
                    <div class="folder-children" id="chapter-${subjectName}-${chapterIndex}">
                      ${chapter.materials
                        .map((material, materialIndex) => renderMaterial(subjectName, chapterIndex, material, materialIndex))
                        .join("")}
                    </div>
                  </div>
                `
              )
              .join("")}
            ${subjectData.materials
              .map((material, materialIndex) => renderMaterial(subjectName, null, material, materialIndex))
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMaterial(subjectName, chapterIndex, material, materialIndex) {
  return `
    <div class="material-item">
      <span class="material-type">${escapeHtml(material.type)}</span>
      <span class="material-name">${escapeHtml(material.name)}</span>
      <div class="material-actions">
        <button type="button" class="remove-material-btn" data-subject="${subjectName}" data-chapter="${chapterIndex ?? ""}" data-index="${materialIndex}" aria-label="Remove material">✕</button>
      </div>
    </div>
  `;
}

function handleFolderToggle(event) {
  const toggle = event.target.closest("[data-toggle]");
  if (!toggle) return;

  const subject = toggle.dataset.subject;
  const chapter = toggle.dataset.chapter;
  const targetId = chapter !== undefined ? `chapter-${subject}-${chapter}` : `folder-${subject}`;
  const target = getElement(targetId);

  if (target) {
    target.style.display = target.style.display === "none" ? "block" : "none";
  }
}

function showAddMaterialModal() {
  const modal = getElement("addMaterialModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function hideAddMaterialModal() {
  const modal = getElement("addMaterialModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  const materialName = getElement("materialName");
  const materialType = getElement("materialType");

  if (materialName) materialName.value = "";
  if (materialType) materialType.value = "pdf";
}

function updateMaterialChapters() {
  const subjectSelect = getElement("materialSubject");
  const chapterSelect = getElement("materialChapter");

  if (!subjectSelect || !chapterSelect) return;

  const selectedSubject = subjectSelect.value;
  chapterSelect.innerHTML = '<option value="">Select Chapter (Optional)</option>';

  const subject = SUBJECT_CATALOG[selectedSubject];
  if (!subject) return;

  subject.chapters.forEach((chapterName, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = chapterName;
    chapterSelect.appendChild(option);
  });
}

function saveMaterial() {
  const subjectName = getElement("materialSubject")?.value;
  const chapterIndex = getElement("materialChapter")?.value;
  const materialName = getElement("materialName")?.value.trim();
  const materialType = getElement("materialType")?.value;

  if (!subjectName || !materialName) {
    alert("Please fill in all required fields");
    return;
  }

  const material = {
    name: materialName,
    type: materialType,
    dateAdded: new Date().toLocaleDateString()
  };

  if (chapterIndex !== "") {
    folders[subjectName].chapters[chapterIndex].materials.push(material);
  } else {
    folders[subjectName].materials.push(material);
  }

  renderFolderStructure();
  hideAddMaterialModal();
}

function handleRemoveMaterialClick(event) {
  const button = event.target.closest(".remove-material-btn");
  if (!button) return;

  const subject = button.dataset.subject;
  const chapter = button.dataset.chapter;
  const index = Number(button.dataset.index);

  if (chapter === "") {
    folders[subject].materials.splice(index, 1);
  } else {
    folders[subject].chapters[chapter].materials.splice(index, 1);
  }

  renderFolderStructure();
}

function filterMaterials() {
  const term = getElement("searchMaterials")?.value.trim().toLowerCase() ?? "";

  document.querySelectorAll(".material-item").forEach((item) => {
    const name = item.querySelector(".material-name")?.textContent.toLowerCase() ?? "";
    item.style.display = name.includes(term) ? "flex" : "none";
  });
}

const searchMaterials = debounce(filterMaterials, 150);

function populateSubjectSelectors() {
  const subjectNames = Object.keys(SUBJECT_CATALOG);
  const subjectSelect = getElement("subjectSelect");
  const materialSubjectSelect = getElement("materialSubject");

  const fillSelect = (select) => {
    if (!select) return;
    subjectNames.forEach((subjectName) => {
      const option = document.createElement("option");
      option.value = subjectName;
      option.textContent = subjectName;
      select.appendChild(option);
    });
  };

  fillSelect(subjectSelect);
  fillSelect(materialSubjectSelect);

  if (subjectSelect && subjectNames.length > 0) {
    subjectSelect.value = subjectNames[0];
    loadSubjectMarks();
  }
}

function loadSubjectMarks() {
  const subject = getElement("subjectSelect")?.value;
  const marks = subjectMarks[subject];

  if (!marks) return;

  ["ct1", "ct2", "assignment", "midSem", "endSem"].forEach((id) => {
    const input = getElement(id);
    if (input) input.value = marks[id];
  });
}

function calculateCGPA() {
  const subject = getElement("subjectSelect")?.value;
  if (!subject) return;

  const fields = ["ct1", "ct2", "assignment", "midSem", "endSem"];
  const marks = {};

  fields.forEach((id) => {
    marks[id] = parseFloat(getElement(id)?.value) || 0;
  });

  subjectMarks[subject] = marks;

  const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
  const caTotal = caScores[0] + caScores[1];
  const totalScore = caTotal + marks.midSem + marks.endSem;
  const { grade, points } = getGradeInfo(totalScore);

  const requiredEndSem = Math.max(0, 90 - (caTotal + marks.midSem));
  const overallCGPA = calculateOverallCGPA();

  const currentScore = getElement("currentScore");
  const currentGrade = getElement("currentGrade");
  const requirement = getElement("requirement");
  const overallCGPAElement = getElement("overallCGPA");

  if (currentScore) currentScore.textContent = `${Math.round(totalScore)}/100`;
  if (currentGrade) currentGrade.textContent = `${grade} (${points} points)`;
  if (requirement) {
    requirement.textContent = requiredEndSem <= 60 ? `${Math.round(requiredEndSem)}/60 in End Sem` : "Target not achievable";
  }
  if (overallCGPAElement) overallCGPAElement.textContent = overallCGPA.toFixed(2);

  const results = getElement("cgpaResults");
  if (results) {
    results.classList.remove("hidden");
    results.classList.add("fade-in");
  }
}

function calculateOverallCGPA() {
  let totalCredits = 0;
  let weightedPoints = 0;

  Object.entries(subjectMarks).forEach(([subjectName, marks]) => {
    const subject = SUBJECT_CATALOG[subjectName];
    if (!subject) return;

    const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
    const totalScore = caScores[0] + caScores[1] + marks.midSem + marks.endSem;
    const { points } = getGradeInfo(totalScore);

    totalCredits += subject.credits;
    weightedPoints += points * subject.credits;
  });

  return totalCredits > 0 ? weightedPoints / totalCredits : 0;
}

function calculateModeDurations() {
  const totalChapters = getTotalChapters();

  const easyDuration = getElement("easyDuration");
  const normalDuration = getElement("normalDuration");
  const intenseChapters = getElement("intenseChapters");

  if (easyDuration) easyDuration.textContent = `${totalChapters} days`;
  if (normalDuration) normalDuration.textContent = `${Math.ceil(totalChapters / 2)} days`;
  if (intenseChapters) intenseChapters.textContent = `${Math.ceil(totalChapters / 7)}`;
}

function selectPerformanceMode(mode) {
  document.querySelectorAll(".mode-card").forEach((card) => card.classList.remove("selected"));

  const selectedCard = document.querySelector(`.mode-card[data-mode="${mode}"]`);
  selectedCard?.classList.add("selected");

  const studyModeSelect = getElement("studyMode");
  if (studyModeSelect) {
    studyModeSelect.value = mode;
  }

  showModeBreakdown(mode);

  const details = getElement("selectedModeDetails");
  if (details) {
    details.classList.remove("hidden");
    details.classList.add("fade-in");
  }
}

function showModeBreakdown(mode) {
  const breakdown = getElement("modeBreakdown");
  if (!breakdown) return;

  const subjectList = Object.entries(SUBJECT_CATALOG).sort((a, b) => b[1].credits - a[1].credits);

  breakdown.innerHTML = subjectList
    .map(([subjectName, subject]) => {
      let allocation = "";

      if (mode === "easy") {
        allocation = `${subject.chapters.length} days (1 chapter/day)`;
      } else if (mode === "normal") {
        allocation = `${Math.ceil(subject.chapters.length / 2)} days (2 chapters/day)`;
      } else if (mode === "intense") {
        const priority = subject.credits >= 3 ? "High Priority" : "Medium Priority";
        allocation = `${priority} - ${subject.chapters.length} chapters`;
      }

      return `
        <div class="breakdown-item">
          <span>${subjectName} (${subject.credits} credits)</span>
          <span>${allocation}</span>
        </div>
      `;
    })
    .join("");
}