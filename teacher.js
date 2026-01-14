// ----- GLOBAL REFS -----
const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("main-view");
let currentTeacher = null;

// ----- SIDEBAR TOGGLE -----
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ----- LOGOUT -----
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ----- ON AUTH STATE -----
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  currentTeacher = user.uid;
  setTeacherName();
  showDashboard(); // load dashboard by default
});

// ----- SET TEACHER NAME -----
function setTeacherName() {
  db.ref(`users/${currentTeacher}`).once("value").then(snap => {
    document.getElementById("teacher-name").textContent = snap.val().name;
  });
}

// ---------- DASHBOARD OVERVIEW ----------
function showDashboard() {
  closeSidebar();
  mainView.innerHTML = `<h2>Dashboard Overview</h2>
    <div class="card-grid" id="overview-cards"></div>
  `;
  
  const cards = document.getElementById("overview-cards");
  
  // TOTAL CLASSES
  db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
    const totalClasses = snap.size || 0;
    const card = document.createElement("div");
    card.className = "card overview-card";
    card.innerHTML = `
      <h3>📚 Total Classes</h3>
      <p>${totalClasses}</p>
    `;
    cards.appendChild(card);

    // TOTAL STUDENTS & ATTENDANCE
    let studentCount = 0;
    let presentToday = 0;
    const today = new Date().toISOString().split("T")[0];
    
    snap.forEach(c => {
      db.ref(`classes/${c.key}`).once("value").then(csnap => {
        const cls = csnap.val();
        const students = cls.students || {};
        studentCount += Object.keys(students).length;

        const attendanceToday = cls.attendance?.[today] || {};
        Object.values(attendanceToday).forEach(v => {
          if (v === "present") presentToday++;
        });

        // Only after processing last class, show student and attendance cards
        if (c.key === snap.keys().pop()) {
          const stuCard = document.createElement("div");
          stuCard.className = "card overview-card";
          stuCard.innerHTML = `<h3>👩‍🎓 Total Students</h3><p>${studentCount}</p>`;
          cards.appendChild(stuCard);

          const perc = studentCount ? Math.round((presentToday / studentCount) * 100) : 0;
          const attCard = document.createElement("div");
          attCard.className = "card overview-card";
          attCard.innerHTML = `<h3>📝 Attendance Today</h3><p>${perc}%</p>`;
          cards.appendChild(attCard);
        }
      });
    });
  });
}

// ---------- SHOW CLASSES ----------
function showClasses() {
  closeSidebar();
  mainView.innerHTML = `<h2>My Classes</h2><div id="class-list" class="card-grid"></div>`;

  db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
    const list = document.getElementById("class-list");
    list.innerHTML = "";
    snap.forEach(c => {
      db.ref(`classes/${c.key}`).once("value").then(csnap => {
        const cls = csnap.val();
        const card = document.createElement("div");
        card.className = "card class-card";
        card.innerHTML = `
          <h3>${cls.name}</h3>
          <p>Subjects: ${Object.values(cls.subjects || {}).join(", ")}</p>
          <p>Total Students: ${Object.keys(cls.students || {}).length}</p>
          <button onclick="showClassDetail('${c.key}')">View Class</button>
        `;
        list.appendChild(card);
      });
    });
  });
}

// ---------- CLASS DETAIL ----------
function showClassDetail(classId) {
  closeSidebar();
  mainView.innerHTML = `<h2>Class Dashboard</h2>
    <div id="attendance-controls" class="card">
      <label>Date: <input type="date" id="att-date" /></label>
      <button onclick="markAttendance('${classId}')">Mark Attendance</button>
    </div>
    <div id="student-list" class="card-grid"></div>
  `;

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    const list = document.getElementById("student-list");
    list.innerHTML = "";
    snap.forEach(s => {
      db.ref(`users/${s.key}`).once("value").then(ssnap => {
        const stu = ssnap.val();
        const card = document.createElement("div");
card.className = "card student-card";
card.id = `card-${s.key}`;
card.innerHTML = `
  <h4>${stu.name}</h4>
  <p>Email: ${stu.email}</p>
  <select id="status-${s.key}" onchange="highlightCard('${s.key}')">
    <option value="present">Present</option>
    <option value="absent">Absent</option>
  </select>
`;
list.appendChild(card);
        function highlightCard(sid) {
  const card = document.getElementById(`card-${sid}`);
  const status = document.getElementById(`status-${sid}`).value;
  if (status === "present") {
    card.classList.add("present");
    card.classList.remove("absent");
  } else {
    card.classList.add("absent");
    card.classList.remove("present");
  }
        }

// ---------- MARK ATTENDANCE ----------
// ---------- TOAST NOTIFICATION ----------
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ---------- MARK ATTENDANCE ----------
function markAttendance(classId) {
  const date = document.getElementById("att-date").value;
  if (!date) return showToast("Select date!", "error");

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    snap.forEach(s => {
      const status = document.getElementById(`status-${s.key}`).value;
      db.ref(`classes/${classId}/attendance/${date}/${s.key}`).set(status);

      // Highlight card
      const card = document.getElementById(`card-${s.key}`);
      if (status === "present") {
        card.classList.add("present");
        card.classList.remove("absent");
      } else {
        card.classList.add("absent");
        card.classList.remove("present");
      }
    });

    showToast("Attendance marked successfully!");
  });
}

// ---------- SHOW DEFAULTERS ----------
function showDefaulters() {
  closeSidebar();
  mainView.innerHTML = `<h2>Defaulters</h2><div id="defaulters-list" class="card-grid"></div>`;

  db.ref("settings/minAttendancePercent").once("value").then(minSnap => {
    const minPercent = minSnap.val();
    db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
      snap.forEach(c => {
        db.ref(`classes/${c.key}`).once("value").then(csnap => {
          const cls = csnap.val();
          const students = cls.students || {};
          const attendance = cls.attendance || {};
          const totalDays = Object.keys(attendance).length || 1;
          const list = document.getElementById("defaulters-list");

          Object.keys(students).forEach(sid => {
            let presentCount = 0;
            Object.values(attendance).forEach(day => {
              if (day[sid] === "present") presentCount++;
            });
            const percent = Math.round((presentCount / totalDays) * 100);
            db.ref(`users/${sid}`).once("value").then(ssnap => {
              const stu = ssnap.val();
              const card = document.createElement("div");
              card.className = "card student-card " + (percent < minPercent ? "low-attendance" : "ok-attendance");
              card.innerHTML = `
                <h4>${stu.name}</h4>
                <p>Attendance: ${percent}%</p>
                <p>Class: ${cls.name}</p>
              `;
              list.appendChild(card);
            });
          });
        });
      });
    });
  });
          }
