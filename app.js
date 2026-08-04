// Application data from the provided JSON
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

const gradeScale = {
  "EX": { min: 91, points: 10 },
  "AA": { min: 86, points: 9 },
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

// Global state
let studyPlan = [];
let folderStructure = {};
let subjectMarks = {};

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
  setupEventListeners();
  populateSubjectSelectors();
  initializeFolderStructure();
  calculateModeDurations();
});

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initializeApp() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 7);
  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 90);

  const startDateInput = document.getElementById('startDate');
  const examDateInput = document.getElementById('examDate');

  if (startDateInput) startDateInput.value = formatDateLocal(startDate);
  if (examDateInput) examDateInput.value = formatDateLocal(examDate);

  Object.keys(subjects).forEach(subject => {
    subjectMarks[subject] = {
      ct1: 0,
      ct2: 0,
      assignment: 0,
      midSem: 0,
      endSem: 0
    };
  });
}

function setupEventListeners() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      switchTab(this.dataset.tab);
    });
  });

  const generateBtn = document.getElementById('generatePlan');
  if (generateBtn) {
    generateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      generateStudyPlan();
    });
  }

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

  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      selectPerformanceMode(this.dataset.mode);
    });
  });

  const cancelBtn = document.getElementById('cancelMaterial');
  const saveBtn = document.getElementById('saveMaterial');
  const closeBtn = document.querySelector('.modal-close');

  if (cancelBtn) cancelBtn.addEventListener('click', hideAddMaterialModal);
  if (saveBtn) saveBtn.addEventListener('click', saveMaterial);
  if (closeBtn) closeBtn.addEventListener('click', hideAddMaterialModal);

  const materialSubject = document.getElementById('materialSubject');
  if (materialSubject) {
    materialSubject.addEventListener('change', updateMaterialChapters);
  }
}

function switchTab(tabId) {
  if (!tabId) return;

  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });

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

  if (!startDateInput.value || !examDateInput.value || isNaN(startDate) || isNaN(examDate)) {
    alert('Please select valid start and exam dates');
    return;
  }

  if (examDate <= startDate) {
    alert('Exam date must be after start date');
    return;
  }

  if (!['intense', 'easy', 'normal'].includes(mode)) {
    alert('Please select a valid study mode');
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

function createStudyPlan(mode, startDate, examDate) {
  const plan = [];
  const subjectList = Object.entries(subjects).sort((a, b) => b[1].credits - a[1].credits);

  if (mode === 'intense') {
    const intenseDays = 7;
    const totalChapters = subjectList.reduce((sum, [, subject]) => sum + subject.chapters.length, 0);
    const chaptersPerDay = Math.ceil(totalChapters / intenseDays) || 1;

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
    const chaptersPerDay = mode === 'easy' ? 1 : 2;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysBetween = Math.ceil((examDate - startDate) / msPerDay);

    if (daysBetween <= 0) return plan;

    let currentDate = new Date(startDate);
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

function displayStudyPlan() {
  const planDetails = document.getElementById('planDetails');
  if (!planDetails) return;

  planDetails.innerHTML = '';

  studyPlan.forEach((day, index) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'plan-day';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `day-${index}`;
    checkbox.addEventListener('change', () => updateProgress(index));

    const info = document.createElement('div');
    info.className = 'plan-day-info';

    const dateDiv = document.createElement('div');
    dateDiv.className = 'plan-date';
    dateDiv.textContent = day.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subjectsDiv = document.createElement('div');
    subjectsDiv.className = 'plan-subjects';

    day.subjects.forEach((s, i) => {
      const badge = document.createElement('span');
      badge.className = `status-badge status-badge--${s.priority}-priority`;
      badge.textContent = s.subject;

      subjectsDiv.appendChild(badge);
      subjectsDiv.append(` ${s.chapter}`);

      if (i < day.subjects.length - 1) {
        subjectsDiv.append(' • ');
      }
    });

    info.appendChild(dateDiv);
    info.appendChild(subjectsDiv);
    dayElement.appendChild(checkbox);
    dayElement.appendChild(info);
    planDetails.appendChild(dayElement);
  });

  updateProgressDisplay();
}

function updateProgress(dayIndex) {
  const checkbox = document.getElementById(`day-${dayIndex}`);
  if (!checkbox) return;

  const dayElement = checkbox.closest('.plan-day');
  if (dayElement) {
    dayElement.classList.toggle('completed', checkbox.checked);
  }

  updateProgressDisplay();
}

function updateProgressDisplay() {
  const completedDays = document.querySelectorAll('.plan-day input:checked').length;
  const totalDays = studyPlan.length;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const progressFill = document.getElementById('overallProgress');
  const progressText = document.getElementById('progressText');

  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${Math.round(progress)}% Complete`;
}

// SECTION 2: Folder Manager
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

function renderFolderStructure() {
  const container = document.getElementById('folderStructure');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(folderStructure).forEach(([subjectName, subjectData]) => {
    const chapterMaterials = Object.values(subjectData.chapters).reduce(
      (sum, chapter) => sum + chapter.materials.length,
      0
    );
    const totalMaterials = subjectData.materials.length + chapterMaterials;

    const subjectFolder = document.createElement('div');
    subjectFolder.className = 'folder-item';

    const subjectHeader = createFolderHeader('📁', subjectName, totalMaterials, () => {
      toggleFolder(subjectName);
    });
    subjectFolder.appendChild(subjectHeader);

    const subjectChildren = document.createElement('div');
    subjectChildren.className = 'folder-children';
    subjectChildren.id = `folder-${subjectName}`;

    Object.entries(subjectData.chapters).forEach(([chapterIndex, chapter]) => {
      const chapterFolder = document.createElement('div');
      chapterFolder.className = 'folder-item';

      const chapterHeader = createFolderHeader('📄', chapter.name, chapter.materials.length, () => {
        toggleChapter(subjectName, Number(chapterIndex));
      });
      chapterFolder.appendChild(chapterHeader);

      const chapterChildren = document.createElement('div');
      chapterChildren.className = 'folder-children';
      chapterChildren.id = `chapter-${subjectName}-${chapterIndex}`;

      chapter.materials.forEach((material, materialIndex) => {
        chapterChildren.appendChild(
          createMaterialItem(material, subjectName, Number(chapterIndex), materialIndex)
        );
      });

      chapterFolder.appendChild(chapterChildren);
      subjectChildren.appendChild(chapterFolder);
    });

    subjectData.materials.forEach((material, materialIndex) => {
      subjectChildren.appendChild(createMaterialItem(material, subjectName, null, materialIndex));
    });

    subjectFolder.appendChild(subjectChildren);
    container.appendChild(subjectFolder);
  });
}

function createFolderHeader(icon, name, count, clickHandler) {
  const header = document.createElement('div');
  header.className = 'folder-header';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'folder-icon';
  iconSpan.textContent = icon;

  const nameSpan = document.createElement('span');
  nameSpan.className = 'folder-name';
  nameSpan.textContent = name;

  const countSpan = document.createElement('span');
  countSpan.className = 'material-count';
  countSpan.textContent = `(${count} materials)`;

  header.append(iconSpan, nameSpan, countSpan);
  if (typeof clickHandler === 'function') {
    header.addEventListener('click', clickHandler);
  }
  return header;
}

function createMaterialItem(material, subjectName, chapterIndex, materialIndex) {
  const item = document.createElement('div');
  item.className = 'material-item';

  const typeSpan = document.createElement('span');
  typeSpan.className = 'material-type';
  typeSpan.textContent = material.type;

  const nameSpan = document.createElement('span');
  nameSpan.className = 'material-name';
  nameSpan.textContent = material.name;

  const actions = document.createElement('div');
  actions.className = 'material-actions';

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', () => removeMaterial(subjectName, chapterIndex, materialIndex));

  actions.appendChild(removeBtn);
  item.append(typeSpan, nameSpan, actions);
  return item;
}

function toggleFolder(subjectName) {
  const folder = document.getElementById(`folder-${subjectName}`);
  if (!folder) return;
  folder.style.display = folder.style.display === 'none' ? 'block' : 'none';
}

function toggleChapter(subjectName, chapterIndex) {
  const chapter = document.getElementById(`chapter-${subjectName}-${chapterIndex}`);
  if (!chapter) return;
  chapter.style.display = chapter.style.display === 'none' ? 'block' : 'none';
}

function showAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) modal.classList.remove('hidden');
}

function hideAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) modal.classList.add('hidden');

  const materialName = document.getElementById('materialName');
  const materialType = document.getElementById('materialType');
  const materialChapter = document.getElementById('materialChapter');

  if (materialName) materialName.value = '';
  if (materialType) materialType.value = 'pdf';
  if (materialChapter) materialChapter.value = '';
}

function updateMaterialChapters() {
  const subjectSelect = document.getElementById('materialSubject');
  const chapterSelect = document.getElementById('materialChapter');

  if (!subjectSelect || !chapterSelect) return;

  chapterSelect.innerHTML = '<option value="">Select Chapter (Optional)</option>';

  const selectedSubject = subjectSelect.value;
  if (selectedSubject && subjects[selectedSubject]) {
    subjects[selectedSubject].chapters.forEach((chapter, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = chapter;
      chapterSelect.appendChild(option);
    });
  }
}

function saveMaterial() {
  const subjectSelect = document.getElementById('materialSubject');
  const chapterSelect = document.getElementById('materialChapter');
  const nameInput = document.getElementById('materialName');
  const typeInput = document.getElementById('materialType');

  if (!subjectSelect || !nameInput) {
    alert('Required form elements are missing');
    return;
  }

  const subjectName = subjectSelect.value.trim();
  const materialName = nameInput.value.trim();
  const materialType = typeInput ? typeInput.value : 'pdf';
  const chapterIndex = chapterSelect ? chapterSelect.value : '';

  if (!subjectName || !folderStructure[subjectName]) {
    alert('Please select a valid subject');
    return;
  }

  if (!materialName) {
    alert('Please enter a material name');
    return;
  }

  const material = {
    name: materialName,
    type: materialType,
    dateAdded: new Date().toLocaleDateString()
  };

  if (chapterIndex !== '') {
    const idx = Number(chapterIndex);
    if (!folderStructure[subjectName].chapters[idx]) {
      alert('Invalid chapter selected');
      return;
    }
    folderStructure[subjectName].chapters[idx].materials.push(material);
  } else {
    folderStructure[subjectName].materials.push(material);
  }

  renderFolderStructure();
  hideAddMaterialModal();
}

function removeMaterial(subjectName, chapterIndex, materialIndex) {
  const subject = folderStructure[subjectName];
  if (!subject) return;

  if (chapterIndex !== null && chapterIndex !== undefined && chapterIndex !== '') {
    const chapter = subject.chapters[chapterIndex];
    if (!chapter || materialIndex < 0 || materialIndex >= chapter.materials.length) return;
    chapter.materials.splice(materialIndex, 1);
  } else {
    if (materialIndex < 0 || materialIndex >= subject.materials.length) return;
    subject.materials.splice(materialIndex, 1);
  }

  renderFolderStructure();
}

function searchMaterials() {
  const searchInput = document.getElementById('searchMaterials');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const materials = document.querySelectorAll('.material-item');

  materials.forEach(material => {
    const materialName = material.querySelector('.material-name');
    if (!materialName) return;

    const matches = materialName.textContent.toLowerCase().includes(searchTerm);
    material.style.display = matches ? 'flex' : 'none';
  });
}

// SECTION 3: CGPA Calculator
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

function loadSubjectMarks() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  let marks = subjectMarks[subject];

  if (!marks) {
    marks = { ct1: 0, ct2: 0, assignment: 0, midSem: 0, endSem: 0 };
    subjectMarks[subject] = marks;
  }

  setInputValue('ct1', marks.ct1);
  setInputValue('ct2', marks.ct2);
  setInputValue('assignment', marks.assignment);
  setInputValue('midSem', marks.midSem);
  setInputValue('endSem', marks.endSem);
}

function setInputValue(id, value) {
  const input = document.getElementById(id);
  if (input) input.value = value;
}

function getMark(id) {
  const input = document.getElementById(id);
  if (!input) return 0;

  const value = parseFloat(input.value);
  if (isNaN(value)) return 0;
  return Math.max(0, value);
}

function calculateGradePoints(percentage) {
  for (const gradeData of Object.values(gradeScale)) {
    if (percentage >= gradeData.min) {
      return gradeData.points;
    }
  }
  return 0;
}

function calculateCGPA() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  const ct1 = getMark('ct1');
  const ct2 = getMark('ct2');
  const assignment = getMark('assignment');
  const midSem = getMark('midSem');
  const endSem = getMark('endSem');

  subjectMarks[subject] = { ct1, ct2, assignment, midSem, endSem };

  const caScores = [ct1, ct2, assignment].sort((a, b) => b - a);
  const caTotal = caScores[0] + caScores[1];
  const totalScore = caTotal + midSem + endSem;
  const percentage = totalScore;

  const gradePoints = calculateGradePoints(percentage);
  let grade = 'F';
  for (const [gradeName, gradeData] of Object.entries(gradeScale)) {
    if (percentage >= gradeData.min) {
      grade = gradeName;
      break;
    }
  }

  const requiredTotal = 90;
  const currentPartial = caTotal + midSem;
  let requirementText;

  if (currentPartial >= requiredTotal) {
    requirementText = 'Target already achieved';
  } else {
    const requiredEndSem = requiredTotal - currentPartial;
    requirementText = requiredEndSem <= 60
      ? `${Math.round(requiredEndSem)}/60 in End Sem`
      : 'Target not achievable';
  }

  const overallCGPA = calculateOverallCGPA();

  setText('currentScore', `${Math.round(totalScore)}/100`);
  setText('currentGrade', `${grade} (${gradePoints} points)`);
  setText('requirement', requirementText);
  setText('overallCGPA', overallCGPA.toFixed(2));

  const results = document.getElementById('cgpaResults');
  if (results) {
    results.classList.remove('hidden');
    results.classList.add('fade-in');
  }
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function calculateOverallCGPA() {
  let totalCredits = 0;
  let weightedPoints = 0;

  Object.entries(subjects).forEach(([subjectName, subjectData]) => {
    const marks = subjectMarks[subjectName];
    if (!marks) return;

    const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
    const caTotal = caScores[0] + caScores[1];
    const totalScore = caTotal + marks.midSem + marks.endSem;
    const percentage = totalScore;

    const gradePoints = calculateGradePoints(percentage);

    totalCredits += subjectData.credits;
    weightedPoints += gradePoints * subjectData.credits;
  });

  return totalCredits > 0 ? weightedPoints / totalCredits : 0;
}

// SECTION 4: Performance Modes
function calculateModeDurations() {
  const totalChapters = Object.values(subjects).reduce(
    (sum, subject) => sum + subject.chapters.length,
    0
  );

  const easyDuration = document.getElementById('easyDuration');
  const normalDuration = document.getElementById('normalDuration');
  const intenseChapters = document.getElementById('intenseChapters');

  if (easyDuration) easyDuration.textContent = `${totalChapters} days`;
  if (normalDuration) normalDuration.textContent = `${Math.ceil(totalChapters / 2)} days`;
  if (intenseChapters) intenseChapters.textContent = `${Math.ceil(totalChapters / 7)}`;
}

function selectPerformanceMode(mode) {
  document.querySelectorAll('[data-mode]').forEach(el => el.classList.remove('selected'));

  const selectedCard = document.querySelector(`[data-mode="${mode}"]`);
  if (selectedCard) selectedCard.classList.add('selected');

  const studyModeSelect = document.getElementById('studyMode');
  if (studyModeSelect) studyModeSelect.value = mode;

  showModeBreakdown(mode);

  const details = document.getElementById('selectedModeDetails');
  if (details) {
    details.classList.remove('hidden');
    details.classList.add('fade-in');
  }
}

function showModeBreakdown(mode) {
  const breakdown = document.getElementById('modeBreakdown');
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

// Make functions globally available for onclick handlers
window.toggleFolder = toggleFolder;
window.toggleChapter = toggleChapter;
window.removeMaterial = removeMaterial;
window.updateProgress = updateProgress;