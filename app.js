// Application data: subject catalogue with credits and chapter lists
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

// Grade scale: percentage thresholds and corresponding grade points
const gradeScale = {
  "EX": { min: 91, points: 10 },
  "AA": { min: 86, points: 9 },   // Fixed typo in original key ("AA`")
  "AB": { min: 81, points: 8 },
  "BB": { min: 76, points: 7 },
  "BC": { min: 71, points: 6 },
  "CC": { min: 66, points: 5 },
  "CD": { min: 61, points: 4 },
  "DD": { min: 56, points: 0 },
  "DE": { min: 51, points: 0 },
  "EE": { min: 40, points: 0 },
  "EF": { min: 0,  points: 0 }
};

// Milliseconds in one day, used for date calculations
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Global application state
let studyPlan = [];
let folderStructure = {};
let subjectMarks = {};
let studyProgress = {};

// Entry point: initialize the app once the DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
  setupEventListeners();
  populateSubjectSelectors();
  initializeFolderStructure();
  calculateModeDurations();
});

// Set default form values and initialize per-subject state objects
function initializeApp() {
  const today = new Date();

  // Default start date = 1 week from today
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 7);

  // Default exam date = 3 months from today
  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 90);

  const startDateInput = document.getElementById('startDate');
  const examDateInput = document.getElementById('examDate');

  if (startDateInput && examDateInput) {
    startDateInput.value = startDate.toISOString().split('T')[0];
    examDateInput.value = examDate.toISOString().split('T')[0];
  }

  // Initialize marks and chapter progress for every subject
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

// Attach all event listeners required by the UI
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      switchTab(this.dataset.tab);
    });
  });

  // Study plan generator
  const generateBtn = document.getElementById('generatePlan');
  if (generateBtn) {
    generateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      generateStudyPlan();
    });
  }

  // Folder manager
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

  // CGPA calculator
  const calculateBtn = document.getElementById('calculateCGPA');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      calculateCGPA();
    });
  }

  const subjectSelect = document.getElementById('subjectSelect');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', loadSubjectMarks);
  }

  // Performance mode selection
  document.querySelectorAll('.mode-select').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      selectPerformanceMode(this.dataset.mode);
    });
  });

  // Modal controls
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

  // Update chapter dropdown when adding a material
  const materialSubject = document.getElementById('materialSubject');
  if (materialSubject) {
    materialSubject.addEventListener('change', updateMaterialChapters);
  }
}

// Switch active tab and reveal the corresponding content panel
function switchTab(tabId) {
  // Highlight the selected tab
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Hide all tab panels
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });

  // Show the requested panel
  const targetContent = document.getElementById(tabId);
  if (targetContent) {
    targetContent.classList.add('active');
    targetContent.style.display = 'block';
  }
}

// SECTION 1: Study Plan Generator
function generateStudyPlan() {
  const modeSelect = document.getElementById('studyMode');
  const startDateInput = document.getElementById('startDate');
  const examDateInput = document.getElementById('examDate');

  if (!modeSelect || !startDateInput || !examDateInput) {
    return;
  }

  const mode = modeSelect.value;
  const startDate = new Date(startDateInput.value);
  const examDate = new Date(examDateInput.value);

  // Validate date range
  if (!startDateInput.value || !examDateInput.value || examDate <= startDate) {
    alert('Please select valid start and exam dates (exam must be after start).');
    return;
  }

  // Intense mode is a 7-day crash course and needs a full week
  if (mode === 'intense') {
    const daysBetween = Math.ceil((examDate - startDate) / MS_PER_DAY);
    if (daysBetween < 7) {
      alert('Intense mode requires at least 7 days between the start and exam dates.');
      return;
    }
  }

  studyPlan = createStudyPlan(mode, startDate, examDate);
  displayStudyPlan();

  const output = document.getElementById('studyPlanOutput');
  if (output) {
    output.classList.remove('hidden');
    output.classList.add('fade-in');
  }
}

// Build a date-based study plan according to the selected mode
function createStudyPlan(mode, startDate, examDate) {
  const plan = [];

  // Sort subjects by credit weight so heavier subjects are scheduled first
  const subjectList = Object.entries(subjects).sort((a, b) => b[1].credits - a[1].credits);

  if (mode === 'intense') {
    // 7-day crash course ending at the exam date
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

        // Move to the next subject once current subject chapters are exhausted
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
    // Easy mode: 1 chapter/day, Normal mode: 2 chapters/day
    const chaptersPerDay = mode === 'easy' ? 1 : 2;
    const daysBetween = Math.max(1, Math.ceil((examDate - startDate) / MS_PER_DAY));

    let currentDate = new Date(startDate);

    // Flatten all chapters, marking priority by credit value
    const allChapters = [];
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

// Render the generated study plan as a list of days
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

// Mark a study day as completed or pending
function updateProgress(dayIndex) {
  const checkbox = document.getElementById(`day-${dayIndex}`);
  if (!checkbox) return;

  const dayElement = checkbox.closest('.plan-day');
  if (dayElement) {
    dayElement.classList.toggle('completed', checkbox.checked);
  }

  updateProgressDisplay();
}

// Update the overall progress bar and percentage text
function updateProgressDisplay() {
  const completedDays = document.querySelectorAll('.plan-day input:checked').length;
  const totalDays = studyPlan.length;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const progressFill = document.getElementById('overallProgress');
  const progressText = document.getElementById('progressText');

  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }

  if (progressText) {
    progressText.textContent = `${Math.round(progress)}% Complete`;
  }
}

// SECTION 2: Folder Manager
// Build the initial folder structure from the subject catalogue
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

// Render the complete folder tree in the DOM
function renderFolderStructure() {
  const container = document.getElementById('folderStructure');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(folderStructure).forEach(([subjectName, subjectData]) => {
    // Count materials under the subject, including chapter children
    const chapterMaterialCount = Object.values(subjectData.chapters)
      .reduce((sum, chapter) => sum + chapter.materials.length, 0);
    const totalMaterials = subjectData.materials.length + chapterMaterialCount;

    const subjectFolder = document.createElement('div');
    subjectFolder.className = 'folder-item';

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

// Expand/collapse a subject folder
function toggleFolder(subjectName) {
  const folder = document.getElementById(`folder-${subjectName}`);
  if (folder) {
    folder.style.display = folder.style.display === 'none' ? 'block' : 'none';
  }
}

// Expand/collapse a chapter folder
function toggleChapter(subjectName, chapterIndex) {
  const chapter = document.getElementById(`chapter-${subjectName}-${chapterIndex}`);
  if (chapter) {
    chapter.style.display = chapter.style.display === 'none' ? 'block' : 'none';
  }
}

// Show the modal used to add new study materials
function showAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

// Hide the add-material modal and reset its form fields
function hideAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.add('hidden');
  }

  const materialName = document.getElementById('materialName');
  const materialType = document.getElementById('materialType');

  if (materialName) materialName.value = '';
  if (materialType) materialType.value = 'pdf';

  // Also reset the chapter dropdown to its placeholder
  const chapterSelect = document.getElementById('materialChapter');
  if (chapterSelect) chapterSelect.innerHTML = '<option value="">Select Chapter (Optional)</option>';
}

// Populate the chapter dropdown in the add-material modal
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

// Save a new material into the folder structure
function saveMaterial() {
  const subjectName = document.getElementById('materialSubject').value;
  const chapterIndex = document.getElementById('materialChapter').value;
  const materialName = document.getElementById('materialName').value.trim();
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

  // Store either under a specific chapter or at the subject level
  if (chapterIndex !== '') {
    folderStructure[subjectName].chapters[chapterIndex].materials.push(material);
  } else {
    folderStructure[subjectName].materials.push(material);
  }

  renderFolderStructure();
  hideAddMaterialModal();
}

// Remove a material by index from a chapter or from the subject root
function removeMaterial(subjectName, chapterIndex, materialIndex) {
  if (chapterIndex !== null) {
    folderStructure[subjectName].chapters[chapterIndex].materials.splice(materialIndex, 1);
  } else {
    folderStructure[subjectName].materials.splice(materialIndex, 1);
  }

  renderFolderStructure();
}

// Filter visible materials by the user's search term
function searchMaterials() {
  const searchInput = document.getElementById('searchMaterials');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
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

// SECTION 3: CGPA Calculator
// Populate subject dropdowns for the CGPA and material forms
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

    // Load marks for the first subject by default
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

// Load saved marks for the currently selected subject into the form
function loadSubjectMarks() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  const marks = subjectMarks[subject];

  if (!marks) return;

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

// Determine the grade and points for a given percentage
function getGradeForPercentage(percentage) {
  for (const [gradeName, gradeData] of Object.entries(gradeScale)) {
    if (percentage >= gradeData.min) {
      return { grade: gradeName, points: gradeData.points };
    }
  }
  return { grade: 'F', points: 0 };
}

// Compute and display CGPA information for the selected subject
function calculateCGPA() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;

  // Read mark inputs, defaulting empty values to 0
  const ct1 = parseFloat(document.getElementById('ct1').value) || 0;
  const ct2 = parseFloat(document.getElementById('ct2').value) || 0;
  const assignment = parseFloat(document.getElementById('assignment').value) || 0;
  const midSem = parseFloat(document.getElementById('midSem').value) || 0;
  const endSem = parseFloat(document.getElementById('endSem').value) || 0;

  // Persist the marks so overall CGPA can be recalculated
  subjectMarks[subject] = { ct1, ct2, assignment, midSem, endSem };

  // Use the best two of CT1, CT2, and Assignment
  const caScores = [ct1, ct2, assignment].sort((a, b) => b - a);
  const caTotal = caScores[0] + caScores[1];

  const totalScore = caTotal + midSem + endSem;
  const percentage = totalScore; // out of 100

  // Determine grade and points
  const { grade, points: gradePoints } = getGradeForPercentage(percentage);

  // Calculate how many marks are still needed in End Sem for an A grade (90%)
  const requiredTotal = 90;
  const currentPartial = caTotal + midSem;
  const requiredEndSem = Math.max(0, requiredTotal - currentPartial);

  // Compute overall CGPA across all subjects with saved marks
  const overallCGPA = calculateOverallCGPA();

  // Render results
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

// Compute weighted CGPA across all subjects that have saved marks
function calculateOverallCGPA() {
  let totalCredits = 0;
  let weightedPoints = 0;

  Object.entries(subjects).forEach(([subjectName, subjectData]) => {
    const marks = subjectMarks[subjectName];
    if (!marks) return;

    const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
    const caTotal = caScores[0] + caScores[1];
    const totalScore = caTotal + marks.midSem + marks.endSem;
    const percentage = totalScore; // out of 100

    const { points: gradePoints } = getGradeForPercentage(percentage);

    totalCredits += subjectData.credits;
    weightedPoints += gradePoints * subjectData.credits;
  });

  return totalCredits > 0 ? weightedPoints / totalCredits : 0;
}

// SECTION 4: Performance Modes
// Display estimated durations for each study mode
function calculateModeDurations() {
  const totalChapters = Object.values(subjects)
    .reduce((sum, subject) => sum + subject.totalChapters, 0);

  const easyDuration = document.getElementById('easyDuration');
  const normalDuration = document.getElementById('normalDuration');
  const intenseChapters = document.getElementById('intenseChapters');

  if (easyDuration) easyDuration.textContent = `${totalChapters} days`;
  if (normalDuration) normalDuration.textContent = `${Math.ceil(totalChapters / 2)} days`;
  if (intenseChapters) intenseChapters.textContent = `${Math.ceil(totalChapters / 7)}`;
}

// Apply the chosen performance mode to the study mode selector and show details
function selectPerformanceMode(mode) {
  // Update mode selection UI
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.remove('selected');
  });

  const selectedCard = document.querySelector(`[data-mode="${mode}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  // Keep the Section 1 study mode dropdown in sync
  const studyModeSelect = document.getElementById('studyMode');
  if (studyModeSelect) {
    studyModeSelect.value = mode;
  }

  showModeBreakdown(mode);

  const details = document.getElementById('selectedModeDetails');
  if (details) {
    details.classList.remove('hidden');
    details.classList.add('fade-in');
  }
}

// Render a per-subject time allocation for the selected mode
function showModeBreakdown(mode) {
  const breakdown = document.getElementById('modeBreakdown');
  if (!breakdown) return;

  // Sort subjects by credit weight for the breakdown
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

// Expose required functions globally for inline onclick handlers
window.toggleFolder = toggleFolder;
window.toggleChapter = toggleChapter;
window.removeMaterial = removeMaterial;
window.updateProgress = updateProgress;