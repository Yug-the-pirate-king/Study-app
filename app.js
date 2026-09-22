// ============================================================
// STUDY APP - Application Logic
// ============================================================

// -----------------------------------------------------------
// Data constants
// -----------------------------------------------------------

// Subject catalog: credits, chapter list and derived chapter count
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

// Grade scale: minimum percentage and grade points
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

// Maximum marks per component
const MAX_END_SEM = 60;
const MAX_TOTAL_SCORE = 100;

// Milliseconds in one day
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// -----------------------------------------------------------
// Global application state
// -----------------------------------------------------------

let studyPlan = [];
let folderStructure = {};
let subjectMarks = {};
let studyProgress = {};

// -----------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------

/**
 * Safely get a DOM element by ID, returning null if it does not exist.
 * @param {string} id - Element ID.
 * @returns {HTMLElement|null}
 */
function getById(id) {
  return document.getElementById(id);
}

/**
 * Validate that a value is a finite number within an optional range.
 * @param {*} value - The value to validate.
 * @param {number} [min] - Minimum allowed value.
 * @param {number} [max] - Maximum allowed value.
 * @returns {boolean}
 */
function isValidNumber(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * Clamp a number between a minimum and maximum value.
 * @param {number} value - The number to clamp.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a date as a YYYY-MM-DD string for input[type=date] values.
 * @param {Date} date - The date to format.
 * @returns {string}
 */
function formatDateInput(date) {
  return date.toISOString().split('T')[0];
}

// -----------------------------------------------------------
// Initialization
// -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  console.log('App initializing...');
  initializeApp();
  setupEventListeners();
  populateSubjectSelectors();
  initializeFolderStructure();
  calculateModeDurations();
});

/**
 * Set up initial values, default dates and per-subject mark/progress maps.
 */
function initializeApp() {
  console.log('Setting up initial data...');

  const today = new Date();

  // Default start date: one week from today
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 7);

  // Default exam date: three months from today
  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 90);

  const startDateInput = getById('startDate');
  const examDateInput = getById('examDate');

  // Populate date inputs if they exist in the DOM
  if (startDateInput && examDateInput) {
    startDateInput.value = formatDateInput(startDate);
    examDateInput.value = formatDateInput(examDate);
  }

  // Initialize default marks and progress tracking for every subject
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

// -----------------------------------------------------------
// Event listeners
// -----------------------------------------------------------

/**
 * Attach event listeners to all interactive UI elements.
 */
function setupEventListeners() {
  console.log('Setting up event listeners...');

  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      const targetTab = this.dataset.tab;
      console.log('Tab clicked:', targetTab);
      switchTab(targetTab);
    });
  });

  // Study plan generator button
  const generateBtn = getById('generatePlan');
  if (generateBtn) {
    generateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      console.log('Generate plan clicked');
      generateStudyPlan();
    });
  }

  // Folder manager controls
  const addMaterialBtn = getById('addMaterial');
  if (addMaterialBtn) {
    addMaterialBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showAddMaterialModal();
    });
  }

  const searchInput = getById('searchMaterials');
  if (searchInput) {
    searchInput.addEventListener('input', searchMaterials);
  }

  // CGPA calculator controls
  const calculateBtn = getById('calculateCGPA');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      console.log('Calculate CGPA clicked');
      calculateCGPA();
    });
  }

  const subjectSelect = getById('subjectSelect');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', loadSubjectMarks);
  }

  // Performance mode selection
  document.querySelectorAll('.mode-select').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const mode = this.dataset.mode;
      console.log('Mode selected:', mode);
      selectPerformanceMode(mode);
    });
  });

  // Modal controls
  const cancelBtn = getById('cancelMaterial');
  const saveBtn = getById('saveMaterial');
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

  // Update chapter options when material subject changes
  const materialSubject = getById('materialSubject');
  if (materialSubject) {
    materialSubject.addEventListener('change', updateMaterialChapters);
  }
}

// -----------------------------------------------------------
// Tab switching
// -----------------------------------------------------------

/**
 * Switch visible tab content and update active tab styling.
 * @param {string} tabId - ID of the tab content section to display.
 */
function switchTab(tabId) {
  console.log('Switching to tab:', tabId);

  // Update active tab button state
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Hide all tab content sections
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });

  // Show the selected tab content
  const targetContent = getById(tabId);
  if (targetContent) {
    targetContent.classList.add('active');
    targetContent.style.display = 'block';
    console.log('Tab switched successfully to:', tabId);
  } else {
    console.error('Target content not found:', tabId);
  }
}

// -----------------------------------------------------------
// SECTION 1: Study Plan Generator
// -----------------------------------------------------------

/**
 * Read user inputs, build a study plan and render it to the page.
 */
function generateStudyPlan() {
  console.log('Generating study plan...');

  const modeSelect = getById('studyMode');
  const startDateInput = getById('startDate');
  const examDateInput = getById('examDate');

  // Ensure required inputs are present
  if (!modeSelect || !startDateInput || !examDateInput) {
    console.error('Required elements not found');
    return;
  }

  const mode = modeSelect.value;
  const startDate = new Date(startDateInput.value);
  const examDate = new Date(examDateInput.value);

  console.log('Mode:', mode, 'Start:', startDate, 'Exam:', examDate);

  // Validate mode value and date range
  if (!['easy', 'normal', 'intense'].includes(mode)) {
    alert('Please select a valid study mode');
    return;
  }

  if (
    !startDateInput.value ||
    !examDateInput.value ||
    isNaN(startDate.getTime()) ||
    isNaN(examDate.getTime()) ||
    examDate <= startDate
  ) {
    alert('Please select valid start and exam dates');
    return;
  }

  studyPlan = createStudyPlan(mode, startDate, examDate);
  displayStudyPlan();

  const output = getById('studyPlanOutput');
  if (output) {
    output.classList.remove('hidden');
    output.classList.add('fade-in');
  }
}

/**
 * Build a day-by-day study plan based on the selected mode and date range.
 * @param {string} mode - Study mode: 'easy', 'normal' or 'intense'.
 * @param {Date} startDate - Plan start date.
 * @param {Date} examDate - Exam date.
 * @returns {Array<Object>}
 */
function createStudyPlan(mode, startDate, examDate) {
  console.log('Creating study plan for mode:', mode);

  const plan = [];
  const subjectList = Object.entries(subjects).sort((a, b) => b[1].credits - a[1].credits);

  if (mode === 'intense') {
    // Intense mode: 7-day crash course ending at the exam date
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
    // Easy or Normal mode: distribute chapters evenly from start to exam date
    const chaptersPerDay = mode === 'easy' ? 1 : 2;
    const daysBetween = Math.ceil((examDate - startDate) / MS_PER_DAY);

    let currentDate = new Date(startDate);
    let allChapters = [];

    // Create a weighted chapter list ordered by subject credits
    subjectList.forEach(([subjectName, subject]) => {
      subject.chapters.forEach(chapter => {
        allChapters.push({
          subject: subjectName,
          chapter: chapter,
          priority: subject.credits >= 3 ? 'high' : subject.credits === 2 ? 'medium' : 'low'
        });
      });
    });

    // Distribute chapters across available days
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
 * Render the generated study plan into the DOM.
 */
function displayStudyPlan() {
  const planDetails = getById('planDetails');
  if (!planDetails) return;

  planDetails.innerHTML = '';

  studyPlan.forEach((day, index) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'plan-day';

    const dateText = day.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subjectsText = day.subjects.map(s => `
      <span class="status-badge status-badge--${s.priority}-priority">${s.subject}</span>
      ${s.chapter}
    `).join(' • ');

    dayElement.innerHTML = `
      <input type="checkbox" id="day-${index}" onchange="updateProgress(${index})">
      <div class="plan-day-info">
        <div class="plan-date">${dateText}</div>
        <div class="plan-subjects">${subjectsText}</div>
      </div>
    `;

    planDetails.appendChild(dayElement);
  });

  updateProgressDisplay();
}

/**
 * Toggle the completed visual state of a study day and refresh progress.
 * @param {number} dayIndex - Index of the day in the study plan.
 */
function updateProgress(dayIndex) {
  const checkbox = getById(`day-${dayIndex}`);
  if (!checkbox) return;

  const dayElement = checkbox.closest('.plan-day');
  if (!dayElement) return;

  if (checkbox.checked) {
    dayElement.classList.add('completed');
  } else {
    dayElement.classList.remove('completed');
  }

  updateProgressDisplay();
}

/**
 * Calculate and display the overall plan completion percentage.
 */
function updateProgressDisplay() {
  const totalDays = studyPlan.length;
  const completedDays = document.querySelectorAll('.plan-day input:checked').length;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const progressFill = getById('overallProgress');
  const progressText = getById('progressText');

  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${Math.round(progress)}% Complete`;
}

// -----------------------------------------------------------
// SECTION 2: Folder Manager
// -----------------------------------------------------------

/**
 * Create an empty folder structure for every subject and chapter.
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
 * Render the folder tree and attached materials to the page.
 */
function renderFolderStructure() {
  const container = getById('folderStructure');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(folderStructure).forEach(([subjectName, subjectData]) => {
    const chapterMaterialsCount = Object.values(subjectData.chapters).reduce(
      (sum, chapter) => sum + chapter.materials.length,
      0
    );
    const totalMaterials = subjectData.materials.length + chapterMaterialsCount;

    const subjectFolder = document.createElement('div');
    subjectFolder.className = 'folder-item';

    const chaptersHtml = Object.entries(subjectData.chapters).map(([chapterIndex, chapter]) => `
      <div class="folder-item">
        <div class="folder-header" onclick="toggleChapter('${subjectName}', ${chapterIndex})">
          <span class="folder-icon">📄</span>
          <span class="folder-name">${chapter.name}</span>
          <span class="material-count">(${chapter.materials.length} materials)</span>
        </div>
        <div class="folder-children" id="chapter-${subjectName}-${chapterIndex}">
          ${chapter.materials.map((material, materialIndex) => renderMaterialItem(subjectName, chapterIndex, material, materialIndex)).join('')}
        </div>
      </div>
    `).join('');

    const subjectMaterialsHtml = subjectData.materials.map((material, materialIndex) => `
      <div class="material-item">
        <span class="material-type">${material.type}</span>
        <span class="material-name">${material.name}</span>
        <div class="material-actions">
          <button onclick="removeMaterial('${subjectName}', null, ${materialIndex})">✕</button>
        </div>
      </div>
    `).join('');

    subjectFolder.innerHTML = `
      <div class="folder-header" onclick="toggleFolder('${subjectName}')">
        <span class="folder-icon">📁</span>
        <span class="folder-name">${subjectName}</span>
        <span class="material-count">(${totalMaterials} materials)</span>
      </div>
      <div class="folder-children" id="folder-${subjectName}">
        ${chaptersHtml}
        ${subjectMaterialsHtml}
      </div>
    `;

    container.appendChild(subjectFolder);
  });
}

/**
 * Generate HTML for a single material item.
 * @param {string} subjectName - Subject the material belongs to.
 * @param {number|null} chapterIndex - Chapter index, or null for subject-level materials.
 * @param {Object} material - Material object with name and type.
 * @param {number} materialIndex - Index within its parent material list.
 * @returns {string}
 */
function renderMaterialItem(subjectName, chapterIndex, material, materialIndex) {
  return `
    <div class="material-item">
      <span class="material-type">${material.type}</span>
      <span class="material-name">${material.name}</span>
      <div class="material-actions">
        <button onclick="removeMaterial('${subjectName}', ${chapterIndex}, ${materialIndex})">✕</button>
      </div>
    </div>
  `;
}

/**
 * Toggle visibility of a subject folder's children.
 * @param {string} subjectName - Subject identifier.
 */
function toggleFolder(subjectName) {
  const folder = getById(`folder-${subjectName}`);
  if (folder) {
    folder.style.display = folder.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Toggle visibility of a chapter folder's children.
 * @param {string} subjectName - Subject identifier.
 * @param {number} chapterIndex - Chapter index.
 */
function toggleChapter(subjectName, chapterIndex) {
  const chapter = getById(`chapter-${subjectName}-${chapterIndex}`);
  if (chapter) {
    chapter.style.display = chapter.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Show the modal used to add new study materials.
 */
function showAddMaterialModal() {
  const modal = getById('addMaterialModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Hide the add-material modal and reset its form fields.
 */
function hideAddMaterialModal() {
  const modal = getById('addMaterialModal');
  if (modal) {
    modal.classList.add('hidden');
  }

  const materialName = getById('materialName');
  const materialType = getById('materialType');

  if (materialName) materialName.value = '';
  if (materialType) materialType.value = 'pdf';
}

/**
 * Refresh chapter options in the add-material modal based on selected subject.
 */
function updateMaterialChapters() {
  const subjectSelect = getById('materialSubject');
  const chapterSelect = getById('materialChapter');

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
 * Save a new material from the modal form into the folder structure.
 */
function saveMaterial() {
  const subjectName = getById('materialSubject').value;
  const chapterIndex = getById('materialChapter').value;
  const materialName = getById('materialName').value.trim();
  const materialType = getById('materialType').value;

  // Validate required inputs
  if (!subjectName || !materialName) {
    alert('Please fill in all required fields');
    return;
  }

  if (!subjects[subjectName]) {
    alert('Selected subject is not valid');
    return;
  }

  const material = {
    name: materialName,
    type: materialType,
    dateAdded: new Date().toLocaleDateString()
  };

  // Attach to chapter if selected, otherwise to subject root
  if (chapterIndex !== '') {
    if (!folderStructure[subjectName].chapters[chapterIndex]) {
      alert('Selected chapter is not valid');
      return;
    }
    folderStructure[subjectName].chapters[chapterIndex].materials.push(material);
  } else {
    folderStructure[subjectName].materials.push(material);
  }

  renderFolderStructure();
  hideAddMaterialModal();
}

/**
 * Remove a material from a chapter or subject root.
 * @param {string} subjectName - Subject identifier.
 * @param {number|null} chapterIndex - Chapter index, or null for subject-level materials.
 * @param {number} materialIndex - Index of the material to remove.
 */
function removeMaterial(subjectName, chapterIndex, materialIndex) {
  if (!folderStructure[subjectName]) return;

  if (chapterIndex !== null && chapterIndex !== undefined) {
    const chapter = folderStructure[subjectName].chapters[chapterIndex];
    if (chapter && chapter.materials[materialIndex] !== undefined) {
      chapter.materials.splice(materialIndex, 1);
    }
  } else {
    if (folderStructure[subjectName].materials[materialIndex] !== undefined) {
      folderStructure[subjectName].materials.splice(materialIndex, 1);
    }
  }

  renderFolderStructure();
}

/**
 * Filter visible materials by the search input value.
 */
function searchMaterials() {
  const searchInput = getById('searchMaterials');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const materials = document.querySelectorAll('.material-item');

  materials.forEach(material => {
    const materialName = material.querySelector('.material-name');
    if (!materialName) return;

    const name = materialName.textContent.toLowerCase();
    material.style.display = name.includes(searchTerm) ? 'flex' : 'none';
  });
}

// -----------------------------------------------------------
// SECTION 3: CGPA Calculator
// -----------------------------------------------------------

/**
 * Fill subject dropdowns and load the default subject's marks.
 */
function populateSubjectSelectors() {
  const subjectSelect = getById('subjectSelect');
  const materialSubjectSelect = getById('materialSubject');

  if (subjectSelect) {
    Object.keys(subjects).forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });

    // Load first subject by default
    const firstSubject = Object.keys(subjects)[0];
    if (firstSubject) {
      subjectSelect.value = firstSubject;
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
 * Load saved marks for the currently selected subject into the form.
 */
function loadSubjectMarks() {
  const subjectSelect = getById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  const marks = subjectMarks[subject];

  if (!marks) return;

  const fields = {
    ct1: getById('ct1'),
    ct2: getById('ct2'),
    assignment: getById('assignment'),
    midSem: getById('midSem'),
    endSem: getById('endSem')
  };

  Object.entries(fields).forEach(([key, element]) => {
    if (element) element.value = marks[key];
  });
}

/**
 * Validate and parse a mark input value.
 * @param {string} fieldId - ID of the input element.
 * @returns {number} Parsed value clamped between 0 and the maximum allowed.
 */
function parseMarkInput(fieldId, maxValue) {
  const element = getById(fieldId);
  if (!element) return 0;

  const value = parseFloat(element.value);
  if (!isValidNumber(value)) return 0;

  return clamp(value, 0, maxValue);
}

/**
 * Calculate grade, points and CGPA from the current subject marks.
 */
function calculateCGPA() {
  const subjectSelect = getById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  if (!subjects[subject]) {
    alert('Please select a valid subject');
    return;
  }

  // Parse mark inputs, defaulting to 0 for invalid values
  const ct1 = parseMarkInput('ct1', 20);
  const ct2 = parseMarkInput('ct2', 20);
  const assignment = parseMarkInput('assignment', 20);
  const midSem = parseMarkInput('midSem', 30);
  const endSem = parseMarkInput('endSem', MAX_END_SEM);

  // Save marks for the selected subject
  subjectMarks[subject] = { ct1, ct2, assignment, midSem, endSem };

  // Calculate best 2 of CT1, CT2 and Assignment
  const caScores = [ct1, ct2, assignment].sort((a, b) => b - a);
  const caTotal = caScores[0] + caScores[1];

  // Total score out of 100 and percentage
  const totalScore = caTotal + midSem + endSem;
  const percentage = clamp((totalScore / MAX_TOTAL_SCORE) * 100, 0, 100);

  // Determine grade using the grade scale
  const { grade, gradePoints } = determineGrade(percentage);

  // Marks required in end-sem to reach a 90% overall target
  const targetPercentage = 90;
  const currentPartial = caTotal + midSem;
  const requiredEndSem = Math.max(0, targetPercentage - currentPartial);

  // Calculate overall CGPA across all subjects with saved marks
  const overallCGPA = calculateOverallCGPA();

  // Display results in the UI
  const currentScore = getById('currentScore');
  const currentGrade = getById('currentGrade');
  const requirement = getById('requirement');
  const overallCGPAElement = getById('overallCGPA');

  if (currentScore) currentScore.textContent = `${Math.round(totalScore)}/${MAX_TOTAL_SCORE}`;
  if (currentGrade) currentGrade.textContent = `${grade} (${gradePoints} points)`;

  if (requirement) {
    const achievable = requiredEndSem <= MAX_END_SEM;
    requirement.textContent = achievable ? `${Math.round(requiredEndSem)}/${MAX_END_SEM} in End Sem` : 'Target not achievable';
  }

  if (overallCGPAElement) overallCGPAElement.textContent = overallCGPA.toFixed(2);

  const results = getById('cgpaResults');
  if (results) {
    results.classList.remove('hidden');
    results.classList.add('fade-in');
  }
}

/**
 * Determine the grade and points for a given percentage.
 * @param {number} percentage - Overall percentage score.
 * @returns {Object} Object containing grade name and grade points.
 */
function determineGrade(percentage) {
  let grade = 'F';
  let gradePoints = 0;

  for (const [gradeName, gradeData] of Object.entries(gradeScale)) {
    if (percentage >= gradeData.min) {
      grade = gradeName;
      gradePoints = gradeData.points;
      break;
    }
  }

  return { grade, gradePoints };
}

/**
 * Calculate the weighted CGPA across all subjects that have saved marks.
 * @returns {number}
 */
function calculateOverallCGPA() {
  let totalCredits = 0;
  let weightedPoints = 0;

  Object.entries(subjects).forEach(([subjectName, subjectData]) => {
    const marks = subjectMarks[subjectName];
    if (!marks) return;

    const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
    const caTotal = caScores[0] + caScores[1];
    const totalScore = caTotal + marks.midSem + marks.endSem;
    const percentage = clamp((totalScore / MAX_TOTAL_SCORE) * 100, 0, 100);

    const { gradePoints } = determineGrade(percentage);

    totalCredits += subjectData.credits;
    weightedPoints += gradePoints * subjectData.credits;
  });

  return totalCredits > 0 ? weightedPoints / totalCredits : 0;
}

// -----------------------------------------------------------
// SECTION 4: Performance Modes
// -----------------------------------------------------------

/**
 * Display estimated durations for each study mode based on total chapter count.
 */
function calculateModeDurations() {
  const totalChapters = Object.values(subjects).reduce((sum, subject) => sum + subject.totalChapters, 0);

  const easyDuration = getById('easyDuration');
  const normalDuration = getById('normalDuration');
  const intenseChapters = getById('intenseChapters');

  if (easyDuration) easyDuration.textContent = `${totalChapters} days`;
  if (normalDuration) normalDuration.textContent = `${Math.ceil(totalChapters / 2)} days`;
  if (intenseChapters) intenseChapters.textContent = `${Math.ceil(totalChapters / 7)}`;
}

/**
 * Highlight the selected performance mode and show its subject breakdown.
 * @param {string} mode - Selected mode: 'easy', 'normal' or 'intense'.
 */
function selectPerformanceMode(mode) {
  console.log('Selecting performance mode:', mode);

  if (!['easy', 'normal', 'intense'].includes(mode)) {
    console.error('Invalid performance mode:', mode);
    return;
  }

  // Update selected card styling
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.remove('selected');
  });

  const selectedCard = document.querySelector(`[data-mode="${mode}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  // Sync study mode selector in the plan generator
  const studyModeSelect = getById('studyMode');
  if (studyModeSelect) {
    studyModeSelect.value = mode;
  }

  // Render the per-subject allocation breakdown
  showModeBreakdown(mode);

  const details = getById('selectedModeDetails');
  if (details) {
    details.classList.remove('hidden');
    details.classList.add('fade-in');
  }
}

/**
 * Render a per-subject allocation breakdown for the selected mode.
 * @param {string} mode - Selected performance mode.
 */
function showModeBreakdown(mode) {
  const breakdown = getById('modeBreakdown');
  if (!breakdown) return;

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

// -----------------------------------------------------------
// Global exports for inline onclick handlers
// -----------------------------------------------------------

window.toggleFolder = toggleFolder;
window.toggleChapter = toggleChapter;
window.removeMaterial = removeMaterial;
window.updateProgress = updateProgress;