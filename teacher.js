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

/***********************
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "login.html";
  else {
    loadDashboard();
    loadClasses();
    loadAttendanceSubjects();
    loadWelcomeCard(user.uid);
  }
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

/***********************
 ✨ DASHBOARD & WELCOME
************************/
function loadWelcomeCard(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const t = snap.val();
    const container = document.getElementById("welcomeCard");
    container.innerHTML = `
      <div class="welcome-card">
        <h2>Welcome back, <strong>${t.name}</strong> 👋</h2>
        <p>Ready to take attendance today?</p>
      </div>
    `;
  });
}

function loadDashboard() {
  const classCountEl = document.getElementById("classCount");
  const studentCountEl = document.getElementById("studentCount");

  db.ref("classes").on("value", snap => animateCount(classCountEl, snap.numChildren()));

  db.ref("users").on("value", snap => {
    let students = 0;
    snap.forEach(u => {
      if (u.val().role === "student" && u.val().approved === true) students++;
    });
    animateCount(studentCountEl, students);
  });
}

function animateCount(el, target) {
  let count = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    count += step;
    if (count >= target) {
      count = target;
      clearInterval(interval);
    }
    el.innerText = count;
  }, 20);
}

/***********************
 🏫 CLASSES & SUBJECTS
************************/
function loadClasses() {
  const classList = document.getElementById("classList");
  if (!classList) return;

  db.ref("classes").on("value", snap => {
    classList.innerHTML = "";
    snap.forEach(c => {
      const li = document.createElement("li");
      li.className = "class-card";
      li.innerHTML = `
        <strong>${c.val().name}</strong>
        <button onclick="openClassSubjects('${c.key}')">View Subjects</button>
      `;
      classList.appendChild(li);
    });
  });
}

function loadAttendanceSubjects() {
  const subjectSelect = document.getElementById("subjectSelect");
  if (!subjectSelect) return;
  subjectSelect.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(c => {
      const subjects = c.val().subjects || {};
      for (let subId in subjects) {
        const sub = subjects[subId];
        const opt = document.createElement("option");
        opt.value = `${c.key}|${subId}`;
        opt.textContent = `${sub.name} (${c.val().name})`;
        subjectSelect.appendChild(opt);
      }
    });
  });
}

/***********************
 🎓 ATTENDANCE LOGIC
************************/
let attendanceData = {}; // {studentId: 'present'/'absent'}

function toggleAttendance(studentId, status, btn) {
  attendanceData[studentId] = status;
  const presentBtn = document.getElementById(`present-${studentId}`);
  const absentBtn = document.getElementById(`absent-${studentId}`);

  if (status === 'present') {
    presentBtn.classList.add('att-selected');
    absentBtn.classList.remove('att-selected');
  } else {
    absentBtn.classList.add('att-selected');
    presentBtn.classList.remove('att-selected');
  }
}

function saveAttendance() {
  const sel = document.getElementById("subjectSelect").value;
  if (!sel) return showToast("Select a subject ⚠️");

  const [classId, subId] = sel.split("|");
  const date = new Date().toISOString().split('T')[0];

  const updates = {};
  for (let studentId in attendanceData) {
    updates[`${studentId}/${date}`] = attendanceData[studentId];
  }

  db.ref(`attendance/${classId}/${subId}`).update(updates).then(() => {
    showToast("Attendance saved ✅");
    document.getElementById("saveAttendanceBtn").classList.add("fade");
  });
}

/***********************
 🌟 VIEW CLASS SUBJECT STUDENTS
************************/
function openClassSubjects(classId) {
  db.ref(`classes/${classId}`).once("value").then(snap => {
    const cls = snap.val();
    const subjects = cls.subjects || {};
    const container = document.getElementById("classSubjectsContainer");
    container.innerHTML = `<h3>${cls.name} - Subjects</h3>`;

    for (let subId in subjects) {
      const sub = subjects[subId];
      container.innerHTML += `<div class="subject-card">${sub.name} - ${sub.teacherName}</div>`;
    }

    // Show students table
    const students = Object.values(cls.students || {}).sort((a,b)=>a.roll - b.roll);
    let table = `<table class="attendance-table"><tr><th>Roll</th><th>Name</th><th>Attendance</th></tr>`;
    students.forEach(s => {
      table += `
        <tr class="attendance-row">
          <td>${s.roll}</td>
          <td>${s.name}</td>
          <td>
            <button id="present-${s.id}" class="att-btn att-present" onclick="toggleAttendance('${s.id}','present',this)">Present</button>
            <button id="absent-${s.id}" class="att-btn att-absent" onclick="toggleAttendance('${s.id}','absent',this)">Absent</button>
          </td>
        </tr>
      `;
    });
    table += "</table>";
    container.innerHTML += table;
    container.innerHTML += `<button id="saveAttendanceBtn" onclick="saveAttendance()">Save Attendance</button>`;
  });
}

/***********************
 🌟 DEFILTER LOGIC
************************/
function loadDefaulters(classId, subId) {
  const defContainer = document.getElementById("defaultersContainer");
  db.ref(`attendance/${classId}/${subId}`).once("value").then(snap => {
    const records = snap.val() || {};
    const defaulters = [];
    for (let studentId in records) {
      const attendance = Object.values(records[studentId]);
      const presentCount = attendance.filter(a => a==='present').length;
      const total = attendance.length;
      if (presentCount / total < 0.75) {
        defaulters.push(studentId);
      }
    }
    defContainer.innerHTML = `Defaulters: ${defaulters.length}`;
  });
}

/***********************
 🌟 TOAST MESSAGE
************************/
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "save-success";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 100);
  setTimeout(() => t.classList.remove("show"), 3000);
  setTimeout(() => t.remove(), 3500);
}

/***********************
 🌟 SIDEBAR OUTSIDE TAP CLOSE
************************/
document.addEventListener("click", e => {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.querySelector(".menu-btn");

  if (sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      !menuBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});
