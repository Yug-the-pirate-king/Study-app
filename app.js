const SUBJECT_CATALOG = {
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

const GRADE_SCALE = {
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

let studyPlan = [];
let materialFolders = {};
let subjectMarksByName = {};
let subjectChapterProgress = {};

document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
  setupEventListeners();
  populateSubjectDropdowns();
  initializeMaterialFolders();
  renderModeDurations();
});

function initializeApp() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 7);

  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 90);

  const startDateInput = document.getElementById('startDate');
  const examDateInput = document.getElementById('examDate');

  if (startDateInput && examDateInput) {
    startDateInput.value = startDate.toISOString().split('T')[0];
    examDateInput.value = examDate.toISOString().split('T')[0];
  }

  Object.keys(SUBJECT_CATALOG).forEach(subjectName => {
    subjectMarksByName[subjectName] = {
      ct1: 0,
      ct2: 0,
      assignment: 0,
      midSem: 0,
      endSem: 0
    };
    subjectChapterProgress[subjectName] = {};
    SUBJECT_CATALOG[subjectName].chapters.forEach((_, index) => {
      subjectChapterProgress[subjectName][index] = false;
    });
  });
}

function setupEventListeners() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', event => {
      event.preventDefault();
      switchTab(tab.dataset.tab);
    });
  });

  const generateBtn = document.getElementById('generatePlan');
  if (generateBtn) {
    generateBtn.addEventListener('click', event => {
      event.preventDefault();
      handleGeneratePlanClick();
    });
  }

  const addMaterialBtn = document.getElementById('addMaterial');
  if (addMaterialBtn) {
    addMaterialBtn.addEventListener('click', event => {
      event.preventDefault();
      openMaterialModal();
    });
  }

  const searchInput = document.getElementById('searchMaterials');
  if (searchInput) {
    searchInput.addEventListener('input', filterMaterials);
  }

  const calculateBtn = document.getElementById('calculateCGPA');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', event => {
      event.preventDefault();
      handleCalculateCgpaClick();
    });
  }

  const subjectSelect = document.getElementById('subjectSelect');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', loadMarksForSelectedSubject);
  }

  document.querySelectorAll('.mode-select').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      handleModeSelection(button.dataset.mode);
    });
  });

  const cancelBtn = document.getElementById('cancelMaterial');
  const saveBtn = document.getElementById('saveMaterial');
  const closeBtn = document.querySelector('.modal-close');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', event => {
      event.preventDefault();
      closeMaterialModal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', event => {
      event.preventDefault();
      saveNewMaterial();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', event => {
      event.preventDefault();
      closeMaterialModal();
    });
  }

  const materialSubject = document.getElementById('materialSubject');
  if (materialSubject) {
    materialSubject.addEventListener('change', populateMaterialChapterOptions);
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

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

function handleGeneratePlanClick() {
  const modeSelect = document.getElementById('studyMode');
  const startDateInput = document.getElementById('startDate');
  const examDateInput = document.getElementById('examDate');

  if (!modeSelect || !startDateInput || !examDateInput) {
    return;
  }

  const mode = modeSelect.value;
  const startDate = new Date(startDateInput.value);
  const examDate = new Date(examDateInput.value);

  if (!startDateInput.value || !examDateInput.value || examDate <= startDate) {
    alert('Please select valid start and exam dates');
    return;
  }

  studyPlan = buildStudyPlan(mode, startDate, examDate);
  renderStudyPlan();

  const output = document.getElementById('studyPlanOutput');
  if (output) {
    output.classList.remove('hidden');
    output.classList.add('fade-in');
  }
}

function buildStudyPlan(mode, startDate, examDate) {
  const plan = [];
  const subjectList = Object.entries(SUBJECT_CATALOG).sort((a, b) => b[1].credits - a[1].credits);

  if (mode === 'intense') {
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
    const chaptersPerDay = mode === 'easy' ? 1 : 2;
    const daysBetween = Math.ceil((examDate - startDate) / (1000 * 60 * 60 * 24));
    let currentDate = new Date(startDate);
    let allChapters = [];

    subjectList.forEach(([subjectName, subject]) => {
      subject.chapters.forEach(chapterName => {
        allChapters.push({
          subject: subjectName,
          chapter: chapterName,
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

function renderStudyPlan() {
  const planDetails = document.getElementById('planDetails');
  if (!planDetails) return;

  planDetails.innerHTML = '';

  studyPlan.forEach((day, dayIndex) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'plan-day';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `day-${dayIndex}`;
    checkbox.addEventListener('change', () => toggleDayCompletion(dayIndex));

    const subjectsHtml = day.subjects.map(item => `
      <span class="status-badge status-badge--${item.priority}-priority">${escapeHtml(item.subject)}</span>
      ${escapeHtml(item.chapter)}
    `).join(' • ');

    dayElement.appendChild(checkbox);
    dayElement.insertAdjacentHTML('beforeend', `
      <div class="plan-day-info">
        <div class="plan-date">${day.date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</div>
        <div class="plan-subjects">${subjectsHtml}</div>
      </div>
    `);

    planDetails.appendChild(dayElement);
  });

  renderOverallProgress();
}

function toggleDayCompletion(dayIndex) {
  const checkbox = document.getElementById(`day-${dayIndex}`);
  const dayElement = checkbox && checkbox.closest('.plan-day');
  if (!dayElement) return;

  if (checkbox.checked) {
    dayElement.classList.add('completed');
  } else {
    dayElement.classList.remove('completed');
  }

  renderOverallProgress();
}

function renderOverallProgress() {
  const completedDays = document.querySelectorAll('.plan-day input:checked').length;
  const totalDays = studyPlan.length;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const progressFill = document.getElementById('overallProgress');
  const progressText = document.getElementById('progressText');

  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${Math.round(progress)}% Complete`;
}

function initializeMaterialFolders() {
  materialFolders = {};

  Object.keys(SUBJECT_CATALOG).forEach(subjectName => {
    materialFolders[subjectName] = {
      chapters: {},
      materials: []
    };

    SUBJECT_CATALOG[subjectName].chapters.forEach((chapterName, index) => {
      materialFolders[subjectName].chapters[index] = {
        name: chapterName,
        materials: []
      };
    });
  });

  renderMaterialFolders();
}

function renderMaterialFolders() {
  const container = document.getElementById('folderStructure');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(materialFolders).forEach(([subjectName, subjectData]) => {
    const totalMaterials = subjectData.materials.length +
      Object.values(subjectData.chapters).reduce((sum, chapter) => sum + chapter.materials.length, 0);

    const subjectFolder = document.createElement('div');
    subjectFolder.className = 'folder-item';

    const subjectHeader = document.createElement('div');
    subjectHeader.className = 'folder-header';
    subjectHeader.innerHTML = `
      <span class="folder-icon">📁</span>
      <span class="folder-name">${escapeHtml(subjectName)}</span>
      <span class="material-count">(${totalMaterials} materials)</span>
    `;

    const subjectChildrenId = `folder-${sanitizeHtmlId(subjectName)}`;
    const subjectChildren = document.createElement('div');
    subjectChildren.className = 'folder-children';
    subjectChildren.id = subjectChildrenId;

    subjectHeader.addEventListener('click', () => toggleSubjectFolder(subjectName));

    Object.entries(subjectData.chapters).forEach(([chapterIndex, chapter]) => {
      const chapterFolder = document.createElement('div');
      chapterFolder.className = 'folder-item';

      const chapterHeader = document.createElement('div');
      chapterHeader.className = 'folder-header';
      chapterHeader.innerHTML = `
        <span class="folder-icon">📄</span>
        <span class="folder-name">${escapeHtml(chapter.name)}</span>
        <span class="material-count">(${chapter.materials.length} materials)</span>
      `;

      const chapterChildrenId = `chapter-${sanitizeHtmlId(subjectName)}-${chapterIndex}`;
      const chapterChildren = document.createElement('div');
      chapterChildren.className = 'folder-children';
      chapterChildren.id = chapterChildrenId;

      chapterHeader.addEventListener('click', () => toggleChapterFolder(subjectName, chapterIndex));

      chapter.materials.forEach((material, materialIndex) => {
        chapterChildren.appendChild(createMaterialElement(subjectName, chapterIndex, materialIndex, material));
      });

      chapterFolder.appendChild(chapterHeader);
      chapterFolder.appendChild(chapterChildren);
      subjectChildren.appendChild(chapterFolder);
    });

    subjectData.materials.forEach((material, materialIndex) => {
      subjectChildren.appendChild(createMaterialElement(subjectName, null, materialIndex, material));
    });

    subjectFolder.appendChild(subjectHeader);
    subjectFolder.appendChild(subjectChildren);
    container.appendChild(subjectFolder);
  });
}

function createMaterialElement(subjectName, chapterIndex, materialIndex, material) {
  const element = document.createElement('div');
  element.className = 'material-item';
  element.innerHTML = `
    <span class="material-type">${escapeHtml(material.type)}</span>
    <span class="material-name">${escapeHtml(material.name)}</span>
    <div class="material-actions">
      <button type="button" class="remove-material-btn">✕</button>
    </div>
  `;

  const removeButton = element.querySelector('.remove-material-btn');
  removeButton.addEventListener('click', () => deleteMaterial(subjectName, chapterIndex, materialIndex));

  return element;
}

function toggleSubjectFolder(subjectName) {
  const folder = document.getElementById(`folder-${sanitizeHtmlId(subjectName)}`);
  if (!folder) return;

  folder.style.display = folder.style.display === 'none' ? 'block' : 'none';
}

function toggleChapterFolder(subjectName, chapterIndex) {
  const chapter = document.getElementById(`chapter-${sanitizeHtmlId(subjectName)}-${chapterIndex}`);
  if (!chapter) return;

  chapter.style.display = chapter.style.display === 'none' ? 'block' : 'none';
}

function openMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.add('hidden');
  }

  const materialName = document.getElementById('materialName');
  const materialType = document.getElementById('materialType');
  if (materialName) materialName.value = '';
  if (materialType) materialType.value = 'pdf';
}

function populateMaterialChapterOptions() {
  const subjectSelect = document.getElementById('materialSubject');
  const chapterSelect = document.getElementById('materialChapter');

  if (!subjectSelect || !chapterSelect) return;

  const selectedSubject = subjectSelect.value;
  chapterSelect.innerHTML = '<option value="">Select Chapter (Optional)</option>';

  if (selectedSubject && SUBJECT_CATALOG[selectedSubject]) {
    SUBJECT_CATALOG[selectedSubject].chapters.forEach((chapterName, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = chapterName;
      chapterSelect.appendChild(option);
    });
  }
}

function saveNewMaterial() {
  const subjectSelect = document.getElementById('materialSubject');
  const chapterSelect = document.getElementById('materialChapter');
  const nameInput = document.getElementById('materialName');
  const typeInput = document.getElementById('materialType');

  const subjectName = subjectSelect ? subjectSelect.value : '';
  const chapterIndex = chapterSelect ? chapterSelect.value : '';
  const materialName = nameInput ? nameInput.value.trim() : '';
  const materialType = typeInput ? typeInput.value : 'pdf';

  if (!subjectName || !materialName) {
    alert('Please fill in all required fields');
    return;
  }

  const material = {
    name: materialName,
    type: materialType,
    dateAdded: new Date().toLocaleDateString()
  };

  if (chapterIndex !== '') {
    materialFolders[subjectName].chapters[chapterIndex].materials.push(material);
  } else {
    materialFolders[subjectName].materials.push(material);
  }

  renderMaterialFolders();
  closeMaterialModal();
}

function deleteMaterial(subjectName, chapterIndex, materialIndex) {
  if (chapterIndex !== null && chapterIndex !== undefined) {
    materialFolders[subjectName].chapters[chapterIndex].materials.splice(materialIndex, 1);
  } else {
    materialFolders[subjectName].materials.splice(materialIndex, 1);
  }

  renderMaterialFolders();
}

function filterMaterials() {
  const searchInput = document.getElementById('searchMaterials');
  const searchTerm = (searchInput && searchInput.value || '').toLowerCase();

  document.querySelectorAll('.material-item').forEach(item => {
    const nameElement = item.querySelector('.material-name');
    const materialName = nameElement ? nameElement.textContent.toLowerCase() : '';

    item.style.display = materialName.includes(searchTerm) ? 'flex' : 'none';
  });
}

function populateSubjectDropdowns() {
  const subjectSelect = document.getElementById('subjectSelect');
  const materialSubjectSelect = document.getElementById('materialSubject');

  if (subjectSelect) {
    Object.keys(SUBJECT_CATALOG).forEach(subjectName => {
      const option = document.createElement('option');
      option.value = subjectName;
      option.textContent = subjectName;
      subjectSelect.appendChild(option);
    });

    const firstSubject = Object.keys(SUBJECT_CATALOG)[0];
    if (firstSubject) {
      subjectSelect.value = firstSubject;
      loadMarksForSelectedSubject();
    }
  }

  if (materialSubjectSelect) {
    Object.keys(SUBJECT_CATALOG).forEach(subjectName => {
      const option = document.createElement('option');
      option.value = subjectName;
      option.textContent = subjectName;
      materialSubjectSelect.appendChild(option);
    });
  }
}

function loadMarksForSelectedSubject() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const marks = subjectMarksByName[subjectSelect.value];
  if (!marks) return;

  const fieldMap = {
    ct1: 'ct1',
    ct2: 'ct2',
    assignment: 'assignment',
    midSem: 'midSem',
    endSem: 'endSem'
  };

  Object.entries(fieldMap).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (input) input.value = marks[key];
  });
}

function handleCalculateCgpaClick() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  const subject = subjectSelect.value;
  const marks = {
    ct1: parseFloat(document.getElementById('ct1').value) || 0,
    ct2: parseFloat(document.getElementById('ct2').value) || 0,
    assignment: parseFloat(document.getElementById('assignment').value) || 0,
    midSem: parseFloat(document.getElementById('midSem').value) || 0,
    endSem: parseFloat(document.getElementById('endSem').value) || 0
  };

  subjectMarksByName[subject] = marks;

  const { grade, points } = computeGradeFromMarks(marks);
  const requiredEndSem = computeRequiredEndSemForGrade(marks, 'AA');
  const overallCgpa = computeOverallCgpa();
  const totalScore = computeTotalScoreFromMarks(marks);

  const currentScore = document.getElementById('currentScore');
  const currentGrade = document.getElementById('currentGrade');
  const requirement = document.getElementById('requirement');
  const overallCgpaElement = document.getElementById('overallCGPA');

  if (currentScore) currentScore.textContent = `${Math.round(totalScore)}/100`;
  if (currentGrade) currentGrade.textContent = `${grade} (${points} points)`;
  if (requirement) {
    requirement.textContent = requiredEndSem <= 60
      ? `${Math.round(requiredEndSem)}/60 in End Sem`
      : 'Target not achievable';
  }
  if (overallCgpaElement) overallCgpaElement.textContent = overallCgpa.toFixed(2);

  const results = document.getElementById('cgpaResults');
  if (results) {
    results.classList.remove('hidden');
    results.classList.add('fade-in');
  }
}

function computeTotalScoreFromMarks(marks) {
  const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
  const caTotal = caScores[0] + caScores[1];
  return caTotal + marks.midSem + marks.endSem;
}

function computeGradeFromMarks(marks) {
  const totalScore = computeTotalScoreFromMarks(marks);
  const percentage = (totalScore / 100) * 100;

  let grade = 'F';
  let points = 0;

  for (const [gradeName, gradeData] of Object.entries(GRADE_SCALE)) {
    if (percentage >= gradeData.min) {
      grade = gradeName;
      points = gradeData.points;
      break;
    }
  }

  return { grade, points };
}

function computeRequiredEndSemForGrade(marks, gradeName) {
  const targetTotal = GRADE_SCALE[gradeName].min;
  const caScores = [marks.ct1, marks.ct2, marks.assignment].sort((a, b) => b - a);
  const caTotal = caScores[0] + caScores[1];
  const currentPartial = caTotal + marks.midSem;

  return Math.max(0, targetTotal - currentPartial);
}

function computeOverallCgpa() {
  let totalCredits = 0;
  let weightedPoints = 0;

  Object.entries(SUBJECT_CATALOG).forEach(([subjectName, subjectData]) => {
    const marks = subjectMarksByName[subjectName];
    if (marks) {
      const { points } = computeGradeFromMarks(marks);
      totalCredits += subjectData.credits;
      weightedPoints += points * subjectData.credits;
    }
  });

  return totalCredits > 0 ? weightedPoints / totalCredits : 0;
}

function renderModeDurations() {
  const totalChapters = Object.values(SUBJECT_CATALOG).reduce((sum, subject) => sum + subject.totalChapters, 0);

  const easyDuration = document.getElementById('easyDuration');
  const normalDuration = document.getElementById('normalDuration');
  const intenseChapters = document.getElementById('intenseChapters');

  if (easyDuration) easyDuration.textContent = `${totalChapters} days`;
  if (normalDuration) normalDuration.textContent = `${Math.ceil(totalChapters / 2)} days`;
  if (intenseChapters) intenseChapters.textContent = `${Math.ceil(totalChapters / 7)}`;
}

function handleModeSelection(mode) {
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.remove('selected');
  });

  const selectedCard = document.querySelector(`[data-mode="${mode}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  const studyModeSelect = document.getElementById('studyMode');
  if (studyModeSelect) {
    studyModeSelect.value = mode;
  }

  renderModeBreakdown(mode);

  const details = document.getElementById('selectedModeDetails');
  if (details) {
    details.classList.remove('hidden');
    details.classList.add('fade-in');
  }
}

function renderModeBreakdown(mode) {
  const breakdown = document.getElementById('modeBreakdown');
  if (!breakdown) return;

  const subjectList = Object.entries(SUBJECT_CATALOG).sort((a, b) => b[1].credits - a[1].credits);

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
      <span>${escapeHtml(subjectName)} (${subjectData.credits} credits)</span>
      <span>${allocation}</span>
    `;

    breakdown.appendChild(item);
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeHtmlId(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

window.toggleFolder = toggleSubjectFolder;
window.toggleChapter = toggleChapterFolder;
window.removeMaterial = deleteMaterial;
window.updateProgress = toggleDayCompletion;