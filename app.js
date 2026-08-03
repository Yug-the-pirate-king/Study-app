'use strict';

/**
 * Subject catalog containing credits and chapter metadata.
 * @type {Object.<string, {credits: number, chapters: string[], totalChapters: number}>}
 */
const subjects = {
  'Engineering Mathematics-III': {
    credits: 3,
    chapters: [
      'Laplace Transforms',
      'Fourier Series',
      'Partial Differential Equations',
      'Z-Transforms',
      'Functions of Complex Variables'
    ],
    totalChapters: 5
  },
  'Data Structures': {
    credits: 3,
    chapters: [
      'Data, Data types, Arrays and Hash Tables',
      'Stacks and Queues',
      'Linked Lists',
      'Trees and Graphs',
      'Searching and Sorting'
    ],
    totalChapters: 5
  },
  'Discrete Mathematics': {
    credits: 3,
    chapters: [
      'Propositional Logic and Predicates',
      'Set Theory, Functions and Relations',
      'Combinatorics',
      'Graph Theory and Trees',
      'Algebraic Structures'
    ],
    totalChapters: 5
  },
  'Object-Oriented Programming': {
    credits: 2,
    chapters: [
      'Introduction to Classes and Objects',
      'Control Statements and Arrays',
      'Inheritance and Polymorphism',
      'Exception Handling'
    ],
    totalChapters: 4
  },
  'Digital Electronics': {
    credits: 2,
    chapters: [
      'Introduction and Logic Gates',
      'Number Systems',
      'Combinational Logic Design',
      'Design Examples and Circuits',
      'Sequential Circuits and Systems'
    ],
    totalChapters: 5
  },
  'Universal Human Values - II': {
    credits: 2,
    chapters: [
      'Introduction to Value Education',
      'Harmony in the Human Being',
      'Harmony in the Family and Society',
      'Harmony in Nature',
      'Professional Ethics and Applications'
    ],
    totalChapters: 5
  }
};

/**
 * Grade scale mapping minimum percentage to grade points.
 * @type {Object.<string, {min: number, points: number}>}
 */
const gradeScale = Object.freeze({
  EX: { min: 91, points: 10 },
  AA: { min: 86, points: 9 },
  AB: { min: 81, points: 8 },
  BB: { min: 76, points: 7 },
  BC: { min: 71, points: 6 },
  CC: { min: 66, points: 5 },
  CD: { min: 61, points: 4 },
  DD: { min: 56, points: 0 },
  DE: { min: 51, points: 0 },
  EE: { min: 40, points: 0 },
  EF: { min: 0, points: 0 }
});

/** Maximum marks obtainable in a subject. */
const TOTAL_MARKS = 100;

/** Maximum marks for the end-semester component. */
const MAX_END_SEM_MARKS = 60;

/** Minimum percentage required for an A grade (9 points). */
const REQUIRED_A_PERCENTAGE = 90;

/**
 * Current generated study plan.
 * @type {Array<{date: Date, subjects: Array<{subject: string, chapter: string, priority: string}>}>}
 */
let studyPlan = [];

/**
 * Folder hierarchy for organizing study materials.
 * @type {Object.<string, {chapters: Object.<number, {name: string, materials: Array<{name: string, type: string, dateAdded: string}>}>, materials: Array<{name: string, type: string, dateAdded: string}>}>}
 */
let folderStructure = {};

/**
 * Marks entered for each subject.
 * @type {Object.<string, {ct1: number, ct2: number, assignment: number, midSem: number, endSem: number}>}
 */
let subjectMarks = {};

/**
 * Per-subject chapter completion progress.
 * @type {Object.<string, Object.<number, boolean>>}
 */
let studyProgress = {};

/**
 * Bootstrap the application once the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
  setupEventListeners();
  populateSubjectSelectors();
  initializeFolderStructure();
  calculateModeDurations();
});

/**
 * Set up default form values and initialize per-subject state.
 */
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

  Object.keys(subjects).forEach(function (subject) {
    subjectMarks[subject] = {
      ct1: 0,
      ct2: 0,
      assignment: 0,
      midSem: 0,
      endSem: 0
    };
    studyProgress[subject] = {};
    subjects[subject].chapters.forEach(function (chapter, index) {
      studyProgress[subject][index] = false;
    });
  });
}

/**
 * Bind event listeners to static UI controls.
 */
function setupEventListeners() {
  document.querySelectorAll('.nav-tab').forEach(function (tab) {
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

  document.querySelectorAll('.mode-select').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      selectPerformanceMode(this.dataset.mode);
    });
  });

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

  const materialSubject = document.getElementById('materialSubject');
  if (materialSubject) {
    materialSubject.addEventListener('change', updateMaterialChapters);
  }
}

/**
 * Activate the requested tab and deactivate all others.
 * @param {string} tabId - The id of the target tab content element.
 */
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(function (tab) {
    tab.classList.remove('active');
  });

  const activeTab = document.querySelector('[data-tab="' + tabId + '"]');
  if (activeTab) {
    activeTab.classList.add('active');
  }

  document.querySelectorAll('.tab-content').forEach(function (content) {
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

/**
 * Validate inputs and trigger study plan generation.
 */
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

  if (!startDateInput.value || !examDateInput.value || isNaN(startDate.getTime()) || isNaN(examDate.getTime()) || examDate <= startDate) {
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
 * Build a day-by-day study plan based on the selected mode.
 * @param {string} mode - One of 'easy', 'normal', or 'intense'.
 * @param {Date} startDate - Planned study start date.
 * @param {Date} examDate - Target exam date.
 * @returns {Array<{date: Date, subjects: Array<{subject: string, chapter: string, priority: string}>}>}
 */
function createStudyPlan(mode, startDate, examDate) {
  const plan = [];
  const subjectList = Object.entries(subjects).sort(function (a, b) {
    return b[1].credits - a[1].credits;
  });

  if (mode === 'intense') {
    const intenseDays = 7;
    const totalChapters = subjectList.reduce(function (sum, subjectEntry) {
      return sum + subjectEntry[1].totalChapters;
    }, 0);
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
        const subjectName = subjectList[currentSubjectIndex][0];
        const subject = subjectList[currentSubjectIndex][1];

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
    const allChapters = [];

    subjectList.forEach(function (subjectEntry) {
      const subjectName = subjectEntry[0];
      const subject = subjectEntry[1];
      subject.chapters.forEach(function (chapter) {
        allChapters.push({
          subject: subjectName,
          chapter: chapter,
          priority: subject.credits >= 3 ? 'high' : (subject.credits === 2 ? 'medium' : 'low')
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

/**
 * Render the generated study plan into the DOM.
 */
function displayStudyPlan() {
  const planDetails = document.getElementById('planDetails');
  if (!planDetails) {
    return;
  }

  planDetails.innerHTML = '';

  studyPlan.forEach(function (day, index) {
    const dayElement = document.createElement('div');
    dayElement.className = 'plan-day';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'day-' + index;
    checkbox.addEventListener('change', function () {
      updateProgress(index);
    });

    const info = document.createElement('div');
    info.className = 'plan-day-info';

    const dateLine = document.createElement('div');
    dateLine.className = 'plan-date';
    dateLine.textContent = day.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subjectsLine = document.createElement('div');
    subjectsLine.className = 'plan-subjects';

    day.subjects.forEach(function (item, idx) {
      const badge = document.createElement('span');
      badge.className = 'status-badge status-badge--' + item.priority + '-priority';
      badge.textContent = item.subject;

      const chapterText = document.createTextNode(item.chapter);

      subjectsLine.appendChild(badge);
      subjectsLine.appendChild(chapterText);

      if (idx < day.subjects.length - 1) {
        subjectsLine.appendChild(document.createTextNode(' • '));
      }
    });

    info.appendChild(dateLine);
    info.appendChild(subjectsLine);
    dayElement.appendChild(checkbox);
    dayElement.appendChild(info);
    planDetails.appendChild(dayElement);
  });

  updateProgressDisplay();
}

/**
 * Toggle the completed state of a plan day and refresh progress UI.
 * @param {number} dayIndex - Index of the day in the study plan.
 */
function updateProgress(dayIndex) {
  const checkbox = document.getElementById('day-' + dayIndex);
  if (!checkbox) {
    return;
  }

  const dayElement = checkbox.closest('.plan-day');
  if (dayElement) {
    dayElement.classList.toggle('completed', checkbox.checked);
  }

  updateProgressDisplay();
}

/**
 * Update the overall progress bar and percentage text.
 */
function updateProgressDisplay() {
  const completedDays = document.querySelectorAll('.plan-day input:checked').length;
  const totalDays = studyPlan.length;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const progressFill = document.getElementById('overallProgress');
  const progressText = document.getElementById('progressText');

  if (progressFill) {
    progressFill.style.width = progress + '%';
  }

  if (progressText) {
    progressText.textContent = Math.round(progress) + '% Complete';
  }
}

// SECTION 2: Folder Manager

/**
 * Build the initial empty folder structure for every subject.
 */
function initializeFolderStructure() {
  folderStructure = {};

  Object.keys(subjects).forEach(function (subjectName) {
    folderStructure[subjectName] = {
      chapters: {},
      materials: []
    };

    subjects[subjectName].chapters.forEach(function (chapter, index) {
      folderStructure[subjectName].chapters[index] = {
        name: chapter,
        materials: []
      };
    });
  });

  renderFolderStructure();
}

/**
 * Render the folder tree using safe DOM construction (no innerHTML).
 */
function renderFolderStructure() {
  const container = document.getElementById('folderStructure');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  Object.entries(folderStructure).forEach(function (folderEntry) {
    const subjectName = folderEntry[0];
    const subjectData = folderEntry[1];

    const subjectFolder = document.createElement('div');
    subjectFolder.className = 'folder-item';

    const chapterMaterialCount = Object.values(subjectData.chapters).reduce(function (sum, chapter) {
      return sum + chapter.materials.length;
    }, 0);
    const totalMaterials = subjectData.materials.length + chapterMaterialCount;

    const header = createFolderHeader('📁', subjectName, totalMaterials, function () {
      toggleFolder(subjectName);
    });

    const children = document.createElement('div');
    children.className = 'folder-children';
    children.id = 'folder-' + subjectName;

    Object.entries(subjectData.chapters).forEach(function (chapterEntry) {
      const chapterIndex = parseInt(chapterEntry[0], 10);
      const chapter = chapterEntry[1];

      const chapterFolder = document.createElement('div');
      chapterFolder.className = 'folder-item';

      const chapterHeader = createFolderHeader('📄', chapter.name, chapter.materials.length, function () {
        toggleChapter(subjectName, chapterIndex);
      });

      const chapterChildren = document.createElement('div');
      chapterChildren.className = 'folder-children';
      chapterChildren.id = 'chapter-' + subjectName + '-' + chapterIndex;

      chapter.materials.forEach(function (material, materialIndex) {
        chapterChildren.appendChild(createMaterialElement(material, function () {
          removeMaterial(subjectName, chapterIndex, materialIndex);
        }));
      });

      chapterFolder.appendChild(chapterHeader);
      chapterFolder.appendChild(chapterChildren);
      children.appendChild(chapterFolder);
    });

    subjectData.materials.forEach(function (material, materialIndex) {
      children.appendChild(createMaterialElement(material, function () {
        removeMaterial(subjectName, null, materialIndex);
      }));
    });

    subjectFolder.appendChild(header);
    subjectFolder.appendChild(children);
    container.appendChild(subjectFolder);
  });
}

/**
 * Helper to build a folder header row.
 * @param {string} icon - Visual icon for the folder.
 * @param {string} name - Display name.
 * @param {number} count - Number of contained materials.
 * @param {Function} toggleHandler - Click handler for toggling visibility.
 * @returns {HTMLElement}
 */
function createFolderHeader(icon, name, count, toggleHandler) {
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
  countSpan.textContent = '(' + count + ' materials)';

  header.appendChild(iconSpan);
  header.appendChild(nameSpan);
  header.appendChild(countSpan);
  header.addEventListener('click', toggleHandler);

  return header;
}

/**
 * Helper to build a material entry with a safe remove action.
 * @param {{name: string, type: string, dateAdded: string}} material - Material data.
 * @param {Function} removeHandler - Click handler for removing the material.
 * @returns {HTMLElement}
 */
function createMaterialElement(material, removeHandler) {
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
  removeBtn.type = 'button';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', 'Remove material');
  removeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    removeHandler();
  });

  actions.appendChild(removeBtn);

  item.appendChild(typeSpan);
  item.appendChild(nameSpan);
  item.appendChild(actions);

  return item;
}

/**
 * Toggle the visibility of a subject folder.
 * @param {string} subjectName - Subject whose folder should be toggled.
 */
function toggleFolder(subjectName) {
  const folder = document.getElementById('folder-' + subjectName);
  if (folder) {
    folder.style.display = folder.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Toggle the visibility of a chapter folder.
 * @param {string} subjectName - Parent subject.
 * @param {number} chapterIndex - Chapter index to toggle.
 */
function toggleChapter(subjectName, chapterIndex) {
  const chapter = document.getElementById('chapter-' + subjectName + '-' + chapterIndex);
  if (chapter) {
    chapter.style.display = chapter.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Show the add-material modal.
 */
function showAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Hide the add-material modal and reset its form fields.
 */
function hideAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.add('hidden');
  }

  const materialName = document.getElementById('materialName');
  const materialType = document.getElementById('materialType');

  if (materialName) {
    materialName.value = '';
  }

  if (materialType) {
    materialType.value = 'pdf';
  }
}

/**
 * Populate the chapter dropdown in the add-material form based on the selected subject.
 */
function updateMaterialChapters() {
  const subjectSelect = document.getElementById('materialSubject');
  const chapterSelect = document.getElementById('materialChapter');

  if (!subjectSelect || !chapterSelect) {
    return;
  }

  const selectedSubject = subjectSelect.value;

  chapterSelect.innerHTML = '<option value="">Select Chapter (Optional)</option>';

  if (selectedSubject && subjects[selectedSubject]) {
    subjects[selectedSubject].chapters.forEach(function (chapter, index) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = chapter;
      chapterSelect.appendChild(option);
    });
  }
}

/**
 * Save a new study material after validating inputs.
 */
function saveMaterial() {
  const subjectNameInput = document.getElementById('materialSubject');
  const chapterIndexInput = document.getElementById('materialChapter');
  const materialNameInput = document.getElementById('materialName');
  const materialTypeInput = document.getElementById('materialType');

  if (!subjectNameInput || !materialNameInput || !materialTypeInput) {
    return;
  }

  const subjectName = subjectNameInput.value;
  const chapterIndex = chapterIndexInput ? chapterIndexInput.value : '';
  const rawName = materialNameInput.value;
  const materialName = typeof rawName === 'string' ? rawName.trim() : '';
  const materialType = materialTypeInput.value;

  const validTypes = ['pdf', 'video', 'notes', 'link', 'other'];
  if (!subjectName || !subjects[subjectName] || !materialName || validTypes.indexOf(materialType) === -1) {
    alert('Please fill in all required fields');
    return;
  }

  const material = {
    name: materialName,
    type: materialType,
    dateAdded: new Date().toLocaleDateString()
  };

  if (chapterIndex !== '') {
    const chapterIdx = parseInt(chapterIndex, 10);
    if (!isNaN(chapterIdx) && folderStructure[subjectName].chapters[chapterIdx]) {
      folderStructure[subjectName].chapters[chapterIdx].materials.push(material);
    }
  } else {
    folderStructure[subjectName].materials.push(material);
  }

  renderFolderStructure();
  hideAddMaterialModal();
}

/**
 * Remove a material from a subject or one of its chapters.
 * @param {string} subjectName - Subject containing the material.
 * @param {number|null} chapterIndex - Chapter index, or null for subject-level materials.
 * @param {number} materialIndex - Index of the material to remove.
 */
function removeMaterial(subjectName, chapterIndex, materialIndex) {
  if (!folderStructure[subjectName]) {
    return;
  }

  if (chapterIndex !== null) {
    const chapter = folderStructure[subjectName].chapters[chapterIndex];
    if (chapter && chapter.materials[materialIndex] !== undefined) {
      chapter.materials.splice(materialIndex, 1);
    }
  } else if (folderStructure[subjectName].materials[materialIndex] !== undefined) {
    folderStructure[subjectName].materials.splice(materialIndex, 1);
  }

  renderFolderStructure();
}

/**
 * Filter materials by name based on the search input.
 */
function searchMaterials() {
  const searchInput = document.getElementById('searchMaterials');
  if (!searchInput) {
    return;
  }

  const searchTerm = searchInput.value.toLowerCase();
  const materials = document.querySelectorAll('.material-item');

  materials.forEach(function (material) {
    const materialName = material.querySelector('.material-name');
    if (materialName) {
      const visible = materialName.textContent.toLowerCase().indexOf(searchTerm) !== -1;
      material.style.display = visible ? 'flex' : 'none';
    }
  });
}

// SECTION 3: CGPA Calculator

/**
 * Populate subject dropdowns in the CGPA and material sections.
 */
function populateSubjectSelectors() {
  const subjectSelect = document.getElementById('subjectSelect');
  const materialSubjectSelect = document.getElementById('materialSubject');

  if (subjectSelect) {
    subjectSelect.innerHTML = '';
    Object.keys(subjects).forEach(function (subject) {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });

    const subjectKeys = Object.keys(subjects);
    if (subjectKeys.length > 0) {
      subjectSelect.value = subjectKeys[0];
      loadSubjectMarks();
    }
  }

  if (materialSubjectSelect) {
    materialSubjectSelect.innerHTML = '';
    Object.keys(subjects).forEach(function (subject) {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      materialSubjectSelect.appendChild(option);
    });
    updateMaterialChapters();
  }
}

/**
 * Load stored marks for the currently selected subject into the form.
 */
function loadSubjectMarks() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) {
    return;
  }

  const subject = subjectSelect.value;
  const marks = subjectMarks[subject];

  if (!marks) {
    return;
  }

  const fields = ['ct1', 'ct2', 'assignment', 'midSem', 'endSem'];
  fields.forEach(function (field) {
    const input = document.getElementById(field);
    if (input) {
      input.value = marks[field];
    }
  });
}

/**
 * Parse a numeric input value and clamp it to the allowed range.
 * @param {string} id - Input element id.
 * @param {number} max - Maximum allowed value.
 * @returns {number}
 */
function getNumericInput(id, max) {
  const input = document.getElementById(id);
  if (!input) {
    return 0;
  }

  const value = parseFloat(input.value);
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(max, value));
}

/**
 * Compute and display the grade and CGPA for the selected subject.
 */
function calculateCGPA() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) {
    return;
  }

  const subject = subjectSelect.value;
  const ct1 = getNumericInput('ct1', TOTAL_MARKS);
  const ct2 = getNumericInput('ct2', TOTAL_MARKS);
  const assignment = getNumericInput('assignment', TOTAL_MARKS);
  const midSem = getNumericInput('midSem', TOTAL_MARKS);
  const endSem = getNumericInput('endSem', TOTAL_MARKS);

  subjectMarks[subject] = {
    ct1: ct1,
    ct2: ct2,
    assignment: assignment,
    midSem: midSem,
    endSem: endSem
  };

  const caScores = [ct1, ct2, assignment].sort(function (a, b) {
    return b - a;
  });
  const caTotal = caScores[0] + caScores[1];
  const totalScore = Math.min(TOTAL_MARKS, caTotal + midSem + endSem);
  const percentage = (totalScore / TOTAL_MARKS) * 100;

  let grade = 'F';
  let gradePoints = 0;

  const gradeEntries = Object.entries(gradeScale);
  for (let i = 0; i < gradeEntries.length; i++) {
    const gradeName = gradeEntries[i][0];
    const gradeData = gradeEntries[i][1];
    if (percentage >= gradeData.min) {
      grade = gradeName;
      gradePoints = gradeData.points;
      break;
    }
  }

  const currentPartial = caTotal + midSem;
  const requiredEndSem = Math.max(0, REQUIRED_A_PERCENTAGE - currentPartial);

  const overallCGPA = calculateOverallCGPA();

  const currentScore = document.getElementById('currentScore');
  const currentGrade = document.getElementById('currentGrade');
  const requirement = document.getElementById('requirement');
  const overallCGPAElement = document.getElementById('overallCGPA');

  if (currentScore) {
    currentScore.textContent = Math.round(totalScore) + '/100';
  }

  if (currentGrade) {
    currentGrade.textContent = grade + ' (' + gradePoints + ' points)';
  }

  if (requirement) {
    requirement.textContent = requiredEndSem <= MAX_END_SEM_MARKS
      ? Math.round(requiredEndSem) + '/60 in End Sem'
      : 'Target not achievable';
  }

  if (overallCGPAElement) {
    overallCGPAElement.textContent = overallCGPA.toFixed(2);
  }

  const results = document.getElementById('cgpaResults');
  if (results) {
    results.classList.remove('hidden');
    results.classList.add('fade-in');
  }
}

/**
 * Calculate the weighted overall CGPA across all subjects.
 * @returns {number}
 */
function calculateOverallCGPA() {
  let totalCredits = 0;
  let weightedPoints = 0;

  Object.entries(subjects).forEach(function (entry) {
    const subjectName = entry[0];
    const subjectData = entry[1];
    const marks = subjectMarks[subjectName];

    if (marks) {
      const caScores = [marks.ct1, marks.ct2, marks.assignment].sort(function (a, b) {
        return b - a;
      });
      const caTotal = caScores[0] + caScores[1];
      const totalScore = Math.min(TOTAL_MARKS, caTotal + marks.midSem + marks.endSem);
      const percentage = (totalScore / TOTAL_MARKS) * 100;

      let gradePoints = 0;
      const gradeEntries = Object.entries(gradeScale);
      for (let i = 0; i < gradeEntries.length; i++) {
        const gradeData = gradeEntries[i][1];
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

// SECTION 4: Performance Modes

/**
 * Display estimated durations for each performance mode.
 */
function calculateModeDurations() {
  const totalChapters = Object.values(subjects).reduce(function (sum, subject) {
    return sum + subject.totalChapters;
  }, 0);

  const easyDuration = document.getElementById('easyDuration');
  const normalDuration = document.getElementById('normalDuration');
  const intenseChapters = document.getElementById('intenseChapters');

  if (easyDuration) {
    easyDuration.textContent = totalChapters + ' days';
  }

  if (normalDuration) {
    normalDuration.textContent = Math.ceil(totalChapters / 2) + ' days';
  }

  if (intenseChapters) {
    intenseChapters.textContent = String(Math.ceil(totalChapters / 7));
  }
}

/**
 * Highlight a performance mode and show its subject breakdown.
 * @param {string} mode - One of 'easy', 'normal', or 'intense'.
 */
function selectPerformanceMode(mode) {
  document.querySelectorAll('.mode-card').forEach(function (card) {
    card.classList.remove('selected');
  });

  const selectedCard = document.querySelector('[data-mode="' + mode + '"]');
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

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

/**
 * Render the per-subject time allocation for the selected mode.
 * @param {string} mode - One of 'easy', 'normal', or 'intense'.
 */
function showModeBreakdown(mode) {
  const breakdown = document.getElementById('modeBreakdown');
  if (!breakdown) {
    return;
  }

  const subjectList = Object.entries(subjects).sort(function (a, b) {
    return b[1].credits - a[1].credits;
  });

  breakdown.innerHTML = '';

  subjectList.forEach(function (entry) {
    const subjectName = entry[0];
    const subjectData = entry[1];

    let allocation = '';
    if (mode === 'easy') {
      allocation = subjectData.totalChapters + ' days (1 chapter/day)';
    } else if (mode === 'normal') {
      allocation = Math.ceil(subjectData.totalChapters / 2) + ' days (2 chapters/day)';
    } else if (mode === 'intense') {
      const priority = subjectData.credits >= 3 ? 'High Priority' : 'Medium Priority';
      allocation = priority + ' - ' + subjectData.totalChapters + ' chapters';
    }

    const item = document.createElement('div');
    item.className = 'breakdown-item';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = subjectName + ' (' + subjectData.credits + ' credits)';

    const allocationSpan = document.createElement('span');
    allocationSpan.textContent = allocation;

    item.appendChild(nameSpan);
    item.appendChild(allocationSpan);
    breakdown.appendChild(item);
  });
}

// Make core functions globally available for any external HTML onclick handlers.
window.toggleFolder = toggleFolder;
window.toggleChapter = toggleChapter;
window.removeMaterial = removeMaterial;
window.updateProgress = updateProgress;