/***********************
 🔥 FIREBASE CONFIG
************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

let currentTeacher = null;
let selectedClass = null;
let selectedSubject = null;
let attendanceData = {};

/***********************
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "login.html";
  else {
    currentTeacher = user;
    loadDashboard();
    loadSidebar();
    showWelcome();
  }
});

/***********************
 🔥 SIDEBAR TOGGLE
************************/
const sidebar = document.querySelector('.sidebar');
const menuBtn = document.querySelector('.menu-btn');
menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

/***********************
 🎉 WELCOME CARD
************************/
function showWelcome() {
  const nameEl = document.getElementById('welcomeName');
  db.ref('users/' + currentTeacher.uid).once('value').then(snap => {
    const data = snap.val();
    if (nameEl) nameEl.textContent = `Welcome, ${data.name}!`;
  });
}

/***********************
 📊 DASHBOARD CARDS
************************/
function loadDashboard() {
  const classCard = document.getElementById('cardClasses');
  const attendanceCard = document.getElementById('cardAttendance');
  const recordCard = document.getElementById('cardAttendanceRecord');
  const defaulterCard = document.getElementById('cardDefaulters');

  if (classCard) classCard.addEventListener('click', () => openSection('classesSection'));
  if (attendanceCard) attendanceCard.addEventListener('click', () => openSection('attendanceSection'));
  if (recordCard) recordCard.addEventListener('click', () => openSection('attendanceRecordSection'));
  if (defaulterCard) defaulterCard.addEventListener('click', () => openSection('defaulterSection'));
}

/***********************
 🔄 OPEN / CLOSE SECTIONS
************************/
function openSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
}

/***********************
 🏫 LOAD CLASSES
************************/
function loadSidebar() {
  const classList = document.getElementById('sidebarClasses');
  classList.innerHTML = '';
  db.ref('classes').once('value').then(snap => {
    snap.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c.val().name;
      li.addEventListener('click', () => {
        selectedClass = { id: c.key, data: c.val() };
        loadSubjects(c.key);
        sidebar.classList.remove('open');
      });
      classList.appendChild(li);
    });
  });
}

/***********************
 🔹 LOAD SUBJECTS
************************/
function loadSubjects(classId) {
  const subjectList = document.getElementById('subjectSelect');
  subjectList.innerHTML = '<option value="">Select Subject</option>';
  db.ref('classes/' + classId + '/subjects').once('value').then(snap => {
    snap.forEach(sub => {
      // Only show subjects assigned to current teacher
      if (sub.val().teacherId === currentTeacher.uid) {
        const opt = document.createElement('option');
        opt.value = sub.key;
        opt.textContent = sub.val().name;
        subjectList.appendChild(opt);
      }
    });
  });
}

/***********************
 📅 ATTENDANCE LOGIC
************************/
function loadAttendance() {
  if (!selectedClass || !selectedSubject) return toast('Select class & subject ⚠️');

  const tableBody = document.getElementById('attendanceTableBody');
  tableBody.innerHTML = '';
  attendanceData = {};

  db.ref('classes/' + selectedClass.id + '/students').once('value').then(snap => {
    const students = [];
    snap.forEach(stu => students.push({ id: stu.key, ...stu.val() }));
    students.sort((a,b) => a.roll - b.roll); // ascending roll

    students.forEach(s => {
      attendanceData[s.id] = '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td>
          <button class="attendance-btn present" onclick="markAttendance('${s.id}','Present',this)">P</button>
          <button class="attendance-btn absent" onclick="markAttendance('${s.id}','Absent',this)">A</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  });
}

function markAttendance(studentId, status, btn) {
  attendanceData[studentId] = status;
  const row = btn.parentElement;
  row.querySelectorAll('.attendance-btn').forEach(b => {
    b.style.opacity = '0.4';
    b.style.transform = 'scale(0.9)';
  });
  btn.style.opacity = '1';
  btn.style.transform = 'scale(1)';
}

/***********************
 💾 SAVE ATTENDANCE
************************/
function saveAttendance() {
  if (!selectedClass || !selectedSubject) return toast('Select class & subject ⚠️');

  const today = new Date().toISOString().split('T')[0];
  db.ref(`attendance/${selectedClass.id}/${selectedSubject}/${today}`).set(attendanceData)
    .then(() => toast('✅ Attendance Saved!', true))
    .then(() => loadDefaulters());
}

/***********************
 🔹 DEFUALTERS LOGIC
************************/
function loadDefaulters() {
  const defaulterTable = document.getElementById('defaulterTableBody');
  defaulterTable.innerHTML = '';
  const today = new Date().toISOString().split('T')[0];

  db.ref(`attendance/${selectedClass.id}/${selectedSubject}/${today}`).once('value').then(snap => {
    snap.forEach(s => {
      if (s.val() === 'Absent') {
        const tr = document.createElement('tr');
        const student = selectedClass.data.students[s.key];
        tr.innerHTML = `<td>${student.roll}</td><td>${student.name}</td>`;
        defaulterTable.appendChild(tr);
      }
    });
  });
}

/***********************
 🌟 TOAST MESSAGE
************************/
function toast(msg, success = false) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = msg;
  t.style.background = success ? 'linear-gradient(135deg,#28a745,#85e085)' : 'linear-gradient(135deg,#ff6b6b,#ffd93d)';
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 100);
  setTimeout(() => t.classList.remove('show'), 3000);
  setTimeout(() => t.remove(), 3500);
}

/***********************
 🟢 SUBJECT CHANGE EVENT
************************/
document.getElementById('subjectSelect')?.addEventListener('change', (e) => {
  selectedSubject = e.target.value;
  loadAttendance();
});
