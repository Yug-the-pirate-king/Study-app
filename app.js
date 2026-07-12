/**
 * app.js - Main application logic for the Study App.
 *
 * This file manages four primary features:
 * 1. Study plan generation (easy / normal / intense modes).
 * 2. A folder-based study-material manager.
 * 3. CGPA/grade calculation based on internal assessment marks.
 * 4. Performance-mode selection with per-subject breakdowns.
 */

// =============================================================================
// Static data
// =============================================================================

/**
 * Subject catalogue containing credit weight and chapter list for each course.
 * @type {Object<string, {credits: number, chapters: string[], totalChapters: number}>}
 */
const subjects = {
  "Engineering Mathematics-III": {
    credits: 3,
    chapters: [
      "Laplace Transforms",
      "Fourier Series",
      "Partial Differential Equations",
      "Z-Transforms",
      "Functions of Complex Variables"
    ],
    totalChapters: 5
  },
  "Data Structures": {
    credits: 3,
    chapters: [
      "Data, Data types, Arrays and Hash Tables",
      "Stacks and Queues",
      "Linked Lists",
      "Trees and Graphs",
      "Searching and Sorting"
    ],
    totalChapters: 5
  },
  "Discrete Mathematics": {
    credits: 3,
    chapters: [
      "Propositional Logic and Predicates",
      "Set Theory, Functions and Relations",
      "Combinatorics",
      "Graph Theory and Trees",
      "Algebraic Structures"
    ],
    totalChapters: 5
  },
  "Object-Oriented Programming": {
    credits: 2,
    chapters: [
      "Introduction to Classes and Objects",
      "Control Statements and Arrays",
      "Inheritance and Polymorphism",
      "Exception Handling"
    ],
    totalChapters: 4
  },
  "Digital Electronics": {
    credits: 2,
    chapters: [
      "Introduction and Logic Gates",
      "Number Systems",
      "Combinational Logic Design",
      "Design Examples and Circuits",
      "Sequential Circuits and Systems"
    ],
    totalChapters: 5
  },
  "Universal Human Values - II": {
    credits: 2,
    chapters: [
      "Introduction to Value Education",
      "Harmony in the Human Being",
      "Harmony in the Family and Society",
      "Harmony in Nature",
      "Professional Ethics and Applications"
    ],
    totalChapters: 5
  }
};

/**
 * Grade scale mapping each grade to its minimum percentage and grade points.
 * @type {Object<string, {min: number, points: number}>}
 */
const gradeScale = {
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

// =============================================================================
// Global application state
// =============================================================================

/** @type {Array<Object>} Generated study plan divided into daily tasks. */
let studyPlan = [];

/**
 * Folder hierarchy: each subject contains chapter-level and subject-level materials.
 * @type {Object<string, {chapters: Object<number, {name: string, materials: Object[]}> , materials: Object[]}>}
 */
let folderStructure = {};

/**
 * Internal assessment marks per subject.
 * @type {Object<string, {ct1: number, ct2: number, assignment: number, midSem: number, endSem: number}>}
 */
let subjectMarks = {};

/**
 * Per-subject, per-chapter completion flags.
 * @type {Object<string, Object<number, boolean>>}
 */
let studyProgress = {};

// =============================================================================
// Initialization
// =============================================================================

/**
 * Bootstraps the application once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('App initializing...');
  initializeApp();
  setupEventListeners();
  populateSubjectSelectors();
  initializeFolderStructure();
  calculateModeDurations();
});

/**
 * Sets default dates and initializes per-subject mark/progress structures.
 */
function initializeApp() {
  console.log('Setting up initial data...');

  const today = new Date();

  // Default start date: one week from today.
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 7);

  // Default exam date: three months from today.
  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 90);

  // Populate date inputs if they exist in the DOM.
  const startDateInput = document.getElementById('startDate');
  const examDateInput = document.getElementById('examDate');

  if (startDateInput && examDateInput) {
    startDateInput.value = startDate.toISOString().split('T')[0];
    examDateInput.value = examDate.toISOString().split('T')[0];
  }

  // Initialize marks and progress tracking for every subject.
  Object.keys(subjects).forEach(subject => {
    subjectMarks[subject] = {
      ct1: 0,
      ct2: 0,
      assignment: 0,
      midSem: 0,
      endSem: 0
    };

    studyProgress[subject] = {};
    subjects[subject].chapters.forEach((chapter, index) => {
      studyProgress[subject][index] = false;
    });
  });
}

// =============================================================================
// Event listeners
// =============================================================================

/**
 * Attaches all required DOM event listeners.
 */
function setupEventListeners() {
  console.log('Setting up event listeners...');

  // Tab navigation.
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      const targetTab = this.dataset.tab;
      console.log('Tab clicked:', targetTab);
      switchTab(targetTab);
    });
  });

  // Study-plan generator button.
  const generateBtn = document.getElementById('generatePlan');
  if (generateBtn) {
    generateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      console.log('Generate plan clicked');
      generateStudyPlan();
    });
  }

  // Folder-manager controls.
  const addMaterialBtn = document.getElementById('addMaterial');
  if (addMaterialBtn) {
    addMaterialBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showAddMaterialModal();
    });
  }

  const searchInput = document.getElementById('searchMaterials');
  if (searchInput) {
    searchInput.addEventListener('input', searchMaterials);
  }

  // CGPA calculator controls.
  const calculateBtn = document.getElementById('calculateCGPA');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      console.log('Calculate CGPA clicked');
      calculateCGPA();
    });
  }

  const subjectSelect = document.getElementById('subjectSelect');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', loadSubjectMarks);
  }

  // Performance-mode selection cards.
  document.querySelectorAll('.mode-select').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const mode = this.dataset.mode;
      console.log('Mode selected:', mode);
      selectPerformanceMode(mode);
    });
  });

  // Modal controls.
  const cancelBtn = document.getElementById('cancelMaterial');
  const saveBtn = document.getElementById('saveMaterial');
  const closeBtn = document.querySelector('.modal-close');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideAddMaterialModal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function (e) {
      e.preventDefault();
      saveMaterial();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideAddMaterialModal();
    });
  }

  // Update chapter options when the material subject changes.
  const materialSubject = document.getElementById('materialSubject');
  if (materialSubject) {
    materialSubject.addEventListener('change', updateMaterialChapters);
  }
}

// =============================================================================
// Tab switching
// =============================================================================

/**
 * Activates the requested tab and its associated content panel.
 * @param {string} tabId - Identifier of the tab to activate.
 */
function switchTab(tabId) {
  console.log('Switching to tab:', tabId);

  // Highlight the active tab button.
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Hide every content panel.
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });

  // Show the selected content panel.
  const targetContent = document.getElementById(tabId);
  if (targetContent) {
    targetContent.classList.add('active');
    targetContent.style.display = 'block';
    console.log('Tab switched successfully to:', tabId);
  } else {
    console.error('Target content not found:', tabId);
  }
}

// =============================================================================
// SECTION 1: Study Plan Generator
// =============================================================================

/**
 * Reads user inputs and delegates plan creation and display.
 */
function generateStudyPlan() {
  console.log('Generating study plan...');

  const modeSelect = document.getElementById('studyMode');
  const startDateInput = document.getElementById('startDate');
  const examDateInput = document.getElementById('examDate');

  if (!modeSelect || !startDateInput || !examDateInput) {
    console.error('Required elements not found');
    return;
  }

  const mode = modeSelect.value;
  const startDate = new Date(startDateInput.value);
  const examDate = new Date(examDateInput.value);

  console.log('Mode:', mode, 'Start:', startDate, 'Exam:', examDate);

  if (!startDateInput.value || !examDateInput.value || examDate <= startDate) {
    alert('Please select valid start and exam dates');
    return;
  }

  studyPlan = createStudyPlan(mode, startDate, examDate);
  displayStudyPlan();

  const output = document.getElementById('studyPlanOutput');
  if (output) {
    output.classList.remove('hidden');
    output.classList.add('fade-in');
  }
}

/**
 * Builds a daily study plan according to the selected mode.
 *
 * @param {string} mode - One of 'intense', 'normal', or 'easy'.
 * @param {Date} startDate - Study plan start date.
 * @param {Date} examDate - Target exam date.
 * @returns {Array<{date: Date, subjects: Array<{subject: string, chapter: string, priority: string}>}>} Daily plans.
 */
function createStudyPlan(mode, startDate, examDate) {
  console.log('Creating study plan for mode:', mode);

  const plan = [];

  // Sort subjects so higher-credit subjects are scheduled first.
  const subjectList = Object.entries(subjects).sort((a, b) => b[1].credits - a[1].credits);

  if (mode === 'intense') {
    // Intense mode: 7-day crash course ending on the exam date.
    const intenseDays = 7;
    const totalChapters = subjectList.reduce((sum, [, subject]) => sum + subject.totalChapters, 0);
    const chaptersPerDay = Math.ceil(totalChapters / intenseDays);

    let currentDate = new Date(examDate);
    currentDate.setDate(currentDate.getDate() - intenseDays);

    let chapterIndex = 0;
    let currentSubjectIndex = 0;

    for (let day = 0; day < intenseDays; day++) {
      const dayPlan = {
        date: new Date(currentDate),
        subjects: []
      };

      let chaptersToday = 0;

      // Fill the day with chapters until quota is reached or subjects are exhausted.
      while (chaptersToday < chaptersPerDay && currentSubjectIndex < subjectList.length) {
        const [subjectName, subject] = subjectList[currentSubjectIndex];

        if (chapterIndex < subject.chapters.length) {
          dayPlan.subjects.push({
            subject: subjectName,
            chapter: subject.chapters[chapterIndex],
            priority: subject.credits >= 3 ? 'high' : 'medium'
          });
          chapterIndex++;
          chaptersToday++;
        }

        // Move to next subject once all chapters of the current one are used.
        if (chapterIndex >= subject.chapters.length) {
          currentSubjectIndex++;
          chapterIndex = 0;
        }
      }

      if (dayPlan.subjects.length > 0) {
        plan.push(dayPlan);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    // Easy (1 chapter/day) or Normal (2 chapters/day) mode.
    const chaptersPerDay = mode === 'easy' ? 1 : 2;
    const daysBetween = Math.ceil((examDate - startDate) / (1000 * 60 * 60 * 24));

    let currentDate = new Date(startDate);

    // Flatten all chapters into a single priority-sorted list.
    let allChapters = [];

    subjectList.forEach(([subjectName, subject]) => {
      subject.chapters.forEach(chapter => {
        allChapters.push({
          subject: subjectName,
          chapter: chapter,
          priority: subject.credits >= 3 ? 'high' : subject.credits === 2 ? 'medium' : 'low'
        });
      });
    });

    // Distribute chapters across available days.
    for (let day = 0; day < daysBetween && allChapters.length > 0; day++) {
      const dayPlan = {
        date: new Date(currentDate),
        subjects: []
      };

      for (let i = 0; i < chaptersPerDay && allChapters.length > 0; i++) {
        dayPlan.subjects.push(allChapters.shift());
      }

      if (dayPlan.subjects.length > 0) {
        plan.push(dayPlan);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return plan;
}

/**
 * Renders the generated study plan into the DOM.
 */
function displayStudyPlan() {
  const planDetails = document.getElementById('planDetails');
  if (!planDetails) return;

  planDetails.innerHTML = '';

  studyPlan.forEach((day, index) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'plan-day';

    dayElement.innerHTML = `
      <input type="checkbox" id="day-${index}" onchange="updateProgress(${index})">
      <div class="plan-day-info">
        <div class="plan-date">${day.date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</div>
        <div class="plan-subjects">
          ${day.subjects.map(s => `
            <span class="status-badge status-badge--${s.priority}-priority">${s.subject}</span>
            ${s.chapter}
          `).join(' • ')}
        </div>
      </div>
    `;

    planDetails.appendChild(dayElement);
  });

  updateProgressDisplay();
}

/**
 * Toggles the completed state of a single study-plan day.
 * @param {number} dayIndex - Index of the day in the study plan.
 */
function updateProgress(dayIndex) {
  const checkbox = document.getElementById(`day-${dayIndex}`);
  const dayElement = checkbox.closest('.plan-day');

  if (checkbox.checked) {
    dayElement.classList.add('completed');
  } else {
    dayElement.classList.remove('completed');
  }

  updateProgressDisplay();
}

/**
 * Updates the overall progress bar and percentage text.
 */
function updateProgressDisplay() {
  const completedDays = document.querySelectorAll('.plan-day input:checked').length;
  const totalDays = studyPlan.length;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const progressFill = document.getElementById('overallProgress');
  const progressText = document.getElementById('progressText');

  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${Math.round(progress)}% Complete`;
}

// =============================================================================
// SECTION 2: Folder Manager
// =============================================================================

/**
 * Creates an empty folder hierarchy mirroring the subject/chapter structure.
 */
function initializeFolderStructure() {
  folderStructure = {};

  Object.keys(subjects).forEach(subjectName => {
    folderStructure[subjectName] = {
      chapters: {},
      materials: []
    };

    subjects[subjectName].chapters.forEach((chapter, index) => {
      folderStructure[subjectName].chapters[index] = {
        name: chapter,
        materials: []
      };
    });
  });

  renderFolderStructure();
}

/**
 * Renders the folder hierarchy and any stored materials into the DOM.
 */
function renderFolderStructure() {
  const container = document.getElementById('folderStructure');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(folderStructure).forEach(([subjectName, subjectData]) => {
    const subjectFolder = document.createElement('div');
    subjectFolder.className = 'folder-item';

    // Count materials stored at subject level plus all chapter levels.
    const chapterMaterials = Object.values(subjectData.chapters).reduce(
      (sum, chapter) => sum + chapter.materials.length,
      0
    );
    const totalMaterials = subjectData.materials.length + chapterMaterials;

    subjectFolder.innerHTML = `
      <div class="folder-header" onclick="toggleFolder('${subjectName}')">
        <span class="folder-icon">📁</span>
        <span class="folder-name">${subjectName}</span>
        <span class="material-count">(${totalMaterials} materials)</span>
      </div>
      <div class="folder-children" id="folder-${subjectName}">
        ${Object.entries(subjectData.chapters).map(([chapterIndex, chapter]) => `
          <div class="folder-item">
            <div class="folder-header" onclick="toggleChapter('${subjectName}', ${chapterIndex})">
              <span class="folder-icon">📄</span>
              <span class="folder-name">${chapter.name}</span>
              <span class="material-count">(${chapter.materials.length} materials)</span>
            </div>
            <div class="folder-children" id="chapter-${subjectName}-${chapterIndex}">
              ${chapter.materials.map((material, materialIndex) => `
                <div class="material-item">
                  <span class="material-type">${material.type}</span>
                  <span class="material-name">${material.name}</span>
                  <div class="material-actions">
                    <button onclick="removeMaterial('${subjectName}', ${chapterIndex}, ${materialIndex})">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        ${subjectData.materials.map((material, materialIndex) => `
          <div class="material-item">
            <span class="material-type">${material.type}</span>
            <span class="material-name">${material.name}</span>
            <div class="material-actions">
              <button onclick="removeMaterial('${subjectName}', null, ${materialIndex})">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.appendChild(subjectFolder);
  });
}

/**
 * Collapses/expands a subject folder.
 * @param {string} subjectName - Subject whose folder should be toggled.
 */
function toggleFolder(subjectName) {
  const folder = document.getElementById(`folder-${subjectName}`);
  if (folder) {
    folder.style.display = folder.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Collapses/expands a chapter folder within a subject.
 * @param {string} subjectName - Parent subject name.
 * @param {number} chapterIndex - Index of the chapter to toggle.
 */
function toggleChapter(subjectName, chapterIndex) {
  const chapter = document.getElementById(`chapter-${subjectName}-${chapterIndex}`);
  if (chapter) {
    chapter.style.display = chapter.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Displays the modal used to add new study materials.
 */
function showAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Hides the add-material modal and resets its form fields.
 */
function hideAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.add('hidden');
  }

  // Clear form inputs for the next use.
  const materialName = document.getElementById('materialName');
  const materialType = document.getElementById('materialType');

  if (materialName) materialName.value = '';
  if (materialType) materialType.value = 'pdf';
}

/**
 * Refreshes the chapter dropdown in the add-material modal based on the selected subject.
 */
function updateMaterialChapters() {
  const subjectSelect = document.getElementById('materialSubject');
  const chapterSelect = document.getElementById('materialChapter');

  if (!subjectSelect || !chapterSelect) return;

  const selectedSubject = subjectSelect.value;

  chapterSelect.innerHTML = '<option value="">Select Chapter (Optional)</option>';

  if (selectedSubject && subjects[selectedSubject]) {
    subjects[selectedSubject].chapters.forEach((chapter, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = chapter;
      chapterSelect.appendChild(option);
    });
  }
}

/**
 * Saves a new material into the selected subject/chapter folder.
 */
function saveMaterial() {
  const subjectName = document.getElementById('materialSubject').value;
  const chapterIndex = document.getElementById('materialChapter').value;
  const materialName = document.getElementById('materialName').value;
  const materialType = document.getElementById('materialType').value;

  if (!subjectName || !materialName) {
    alert('Please fill in all required fields');
    return;
  }

  const material = {
    name: materialName,
    type: materialType,
    dateAdded: new Date().toLocaleDateString()
  };

  // Attach material either to a specific chapter or to the subject root.
  if (chapterIndex !== '') {
    folderStructure[subjectName].chapters[chapterIndex].materials.push(material);
  } else {
    folderStructure[subjectName].materials.push(material);
  }

  renderFolderStructure();
  hideAddMaterialModal();
}

/**
 * Removes a material from a subject or chapter folder.
 *
 * @param {string} subjectName - Subject containing the material.
 * @param {number|null} chapterIndex - Chapter index, or null for subject-level materials.
 * @param {number} materialIndex - Index of the material within its container.
 */
function removeMaterial(subjectName, chapterIndex, materialIndex) {
  if (chapterIndex !== null) {
    folderStructure[subjectName].chapters[chapterIndex].materials.splice(materialIndex, 1);
  } else {
    folderStructure[subjectName].materials.splice(materialIndex, 1);
  }

  renderFolderStructure();
}

/**
 * Filters displayed materials based on the search input text.
 */
function searchMaterials() {
  const searchTerm = document.getElementById('searchMaterials').value.toLowerCase();
  const materials = document.querySelectorAll('.material-item');

  materials.forEach(material => {
    const materialName = material.querySelector('.material-name');
    if (materialName && materialName.textContent.toLowerCase().includes(searchTerm)) {
      material.style.display = 'flex';
    } else {
      material.style.display = 'none';
    }
  });
}

// =============================================================================
// SECTION 3: CGPA Calculator
// =============================================================================

/**
 * Populates subject dropdowns for the CGPA calculator and material modal.
 */
function populateSubjectSelectors() {
  const subjectSelect = document.getElementById('subjectSelect');
  const materialSubjectSelect = document.getElementById('materialSubject');

  if (subjectSelect) {
    Object.keys(subjects).forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });

    // Load the first subject's marks by default.
    if (Object.keys(subjects).length > 0) {
      subjectSelect.value = Object.keys(subjects)[0];
      loadSubjectMarks();
    }
  }

  if (materialSubjectSelect) {
    Object.keys(subjects).forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      materialSubjectSelect.appendChild(option);
    });
  }
}

/**
 * Loads stored marks for the currently selected subject into the input fields.
 */
function loadSubjectMarks() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  const marks = subjectMarks[subject];

  if (marks) {
    const ct1 = document.getElementById('ct1');
    const ct2 = document.getElementById('ct2');
    const assignment = document.getElementById('assignment');
    const midSem = document.getElementById('midSem');
    const endSem = document.getElementById('endSem');

    if (ct1) ct1.value = marks.ct1;
    if (ct2) ct2.value = marks.ct2;
    if (assignment) assignment.value = marks.assignment;
    if (midSem) midSem.value = marks.midSem;
    if (endSem) endSem.value = marks.endSem;
  }
}

/**
 * Computes the grade and CGPA for the selected subject and updates the UI.
 */
function calculateCGPA() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  const ct1 = parseFloat(document.getElementById('ct1').value) || 0;
  const ct2 = parseFloat(document.getElementById('ct2').value) || 0;
  const assignment = parseFloat(document.getElementById('assignment').value) || 0;
  const midSem = parseFloat(document.getElementById('midSem').value) || 0;
  const endSem = parseFloat(document.getElementById('endSem').value) || 0;

  // Persist marks for the selected subject.
  subjectMarks[subject] = { ct1, ct2, assignment, midSem, endSem };

  // Use the best two scores out of CT1, CT2, and Assignment.
  const caScores = [ct1, ct2, assignment].sort((a, b) => b - a);
  const caTotal = caScores[0] + caScores[1];

  const totalScore = caTotal + midSem + endSem;
  const percentage = (totalScore / 100) * 100;

  // Determine the grade from the scale.
  let grade = 'F';
  let gradePoints = 0;

  for (const [gradeName, gradeData] of Object.entries(gradeScale)) {
    if (percentage >= gradeData.min) {
      grade = gradeName;
      gradePoints = gradeData.points;
      break;
    }
  }

  // Compute end-sem marks required to reach a 90% (A grade, 9 points) target.
  const requiredTotal = 90;
  const currentPartial = caTotal + midSem;
  const requiredEndSem = Math.max(0, requiredTotal - currentPartial);

  // Compute credit-weighted CGPA across all subjects with saved marks.
  const overallCGPA = calculateOverallCGPA();

  // Render results.
  const currentScore = document.getElementById('currentScore');
  const currentGrade = document.getElementById('currentGrade');
  const requirement = document.getElementById('requirement');
  const overallCGPAElement = document.getElementById('overallCGPA');

  if (currentScore) currentScore.textContent = `${Math.round(totalScore)}/100`;
  if (currentGrade) currentGrade.textContent = `${grade} (${gradePoints} points)`;
  if (requirement) {
    requirement.textContent = requiredEndSem <= 60
      ? `${Math.round(requiredEndSem)}/60 in End Sem`
      : 'Target not achievable';
  }
  if (overallCGPAElement) overallCGPAElement.textContent = overallCGPA.toFixed(2);

  const results = document.getElementById('cgpaResults');
  if (results) {
    results.classList.remove('hidden');
    results.classList.add('fade-in');
  }
}

/**
 * Calculates the cumulative grade point average across all subjects with saved marks.
 * @returns {number} The overall CGPA, or 0 if no marks are recorded.
 */
function calculateOverallCGPA() {
  let totalCredits = 0;
  let weightedPoints = 0;

  Object.entries(subjects).forEach(([subjectName, subjectData]) => {
    const marks = subjectMarks[subjectName];

    if (marks) {
      // Best 2 of CT1, CT2, Assignment.
      const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
      const caTotal = caScores[0] + caScores[1];

      const totalScore = caTotal + marks.midSem + marks.endSem;
      const percentage = (totalScore / 100) * 100;

      let gradePoints = 0;
      for (const [, gradeData] of Object.entries(gradeScale)) {
        if (percentage >= gradeData.min) {
          gradePoints = gradeData.points;
          break;
        }
      }

      totalCredits += subjectData.credits;
      weightedPoints += gradePoints * subjectData.credits;
    }
  });

  return totalCredits > 0 ? weightedPoints / totalCredits : 0;
}

// =============================================================================
// SECTION 4: Performance Modes
// =============================================================================

/**
 * Computes and displays the estimated duration for each study mode.
 */
function calculateModeDurations() {
  const totalChapters = Object.values(subjects).reduce(
    (sum, subject) => sum + subject.totalChapters,
    0
  );

  const easyDuration = document.getElementById('easyDuration');
  const normalDuration = document.getElementById('normalDuration');
  const intenseChapters = document.getElementById('intenseChapters');

  if (easyDuration) easyDuration.textContent = `${totalChapters} days`;
  if (normalDuration) normalDuration.textContent = `${Math.ceil(totalChapters / 2)} days`;
  if (intenseChapters) intenseChapters.textContent = `${Math.ceil(totalChapters / 7)}`;
}

/**
 * Selects a performance mode and updates the related UI sections.
 * @param {string} mode - One of 'easy', 'normal', or 'intense'.
 */
function selectPerformanceMode(mode) {
  console.log('Selecting performance mode:', mode);

  // Highlight the chosen mode card.
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.remove('selected');
  });

  const selectedCard = document.querySelector(`[data-mode="${mode}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  // Sync the study-mode selector used in the plan generator.
  const studyModeSelect = document.getElementById('studyMode');
  if (studyModeSelect) {
    studyModeSelect.value = mode;
  }

  // Render the per-subject allocation breakdown.
  showModeBreakdown(mode);

  const details = document.getElementById('selectedModeDetails');
  if (details) {
    details.classList.remove('hidden');
    details.classList.add('fade-in');
  }
}

/**
 * Renders per-subject time/chapter allocation for the chosen mode.
 * @param {string} mode - One of 'easy', 'normal', or 'intense'.
 */
function showModeBreakdown(mode) {
  const breakdown = document.getElementById('modeBreakdown');
  if (!breakdown) return;

  // Higher-credit subjects first for clearer priority display.
  const subjectList = Object.entries(subjects).sort((a, b) => b[1].credits - a[1].credits);

  breakdown.innerHTML = '';

  subjectList.forEach(([subjectName, subjectData]) => {
    const item = document.createElement('div');
    item.className = 'breakdown-item';

    let allocation = '';
    if (mode === 'easy') {
      allocation = `${subjectData.totalChapters} days (1 chapter/day)`;
    } else if (mode === 'normal') {
      allocation = `${Math.ceil(subjectData.totalChapters / 2)} days (2 chapters/day)`;
    } else if (mode === 'intense') {
      const priority = subjectData.credits >= 3 ? 'High Priority' : 'Medium Priority';
      allocation = `${priority} - ${subjectData.totalChapters} chapters`;
    }

    item.innerHTML = `
      <span>${subjectName} (${subjectData.credits} credits)</span>
      <span>${allocation}</span>
    `;

    breakdown.appendChild(item);
  });
}

// =============================================================================
// Global exports for inline HTML event handlers
// =============================================================================

window.toggleFolder = toggleFolder;
window.toggleChapter = toggleChapter;
window.removeMaterial = removeMaterial;
window.updateProgress = updateProgress;