// ---------------- GLOBAL ----------------
const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("main-view");

let currentTeacher = null;

// ---------------- SIDEBAR ----------------
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ---------------- LOGOUT ----------------
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ---------------- TOAST ----------------
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ---------------- AUTH ----------------
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  currentTeacher = user.uid;
  setTeacherName();
  showDashboard();
});

// ---------------- SET NAME ----------------
function setTeacherName() {
  db.ref(`users/${currentTeacher}`).once("value").then(snap => {
    const nameEl = document.getElementById("teacher-name");
    if (nameEl && snap.exists()) {
      nameEl.innerText = snap.val().name || "Teacher";
    }
  });
}

// ---------------- DASHBOARD ----------------
function showDashboard() {
  closeSidebar();
  mainView.innerHTML = `
    <h2>Dashboard</h2>
    <div class="card-grid" id="dash-cards"></div>
  `;

  const grid = document.getElementById("dash-cards");

  db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
    const classCount = snap.size || 0;

    const card1 = createCard("📚 Classes", classCount);
    const card2 = createCard("👩‍🎓 Students", 0);
    const card3 = createCard("📝 Attendance Today", "0%");

    grid.append(card1, card2, card3);

    let totalStudents = 0;
    let presentToday = 0;
    const today = new Date().toISOString().split("T")[0];

    snap.forEach(c => {
      db.ref(`classes/${c.key}`).once("value").then(csnap => {
        const cls = csnap.val() || {};
        const students = cls.students || {};
        totalStudents += Object.keys(students).length;

        const todayAtt = cls.attendance?.[today] || {};
        Object.values(todayAtt).forEach(v => {
          if (v === "present") presentToday++;
        });

        card2.querySelector("p").innerText = totalStudents;
        const perc = totalStudents ? Math.round((presentToday / totalStudents) * 100) : 0;
        card3.querySelector("p").innerText = `${perc}%`;
      });
    });
  });
}

// ---------------- CLASSES ----------------
function showClasses() {
  closeSidebar();
  mainView.innerHTML = `<h2>My Classes</h2><div class="card-grid" id="class-list"></div>`;

  const list = document.getElementById("class-list");

  db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
    if (!snap.exists()) {
      list.innerHTML = `<p>No classes assigned.</p>`;
      return;
    }

    snap.forEach(c => {
      db.ref(`classes/${c.key}`).once("value").then(csnap => {
        const cls = csnap.val();
        if (!cls) return;

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${cls.name}</h3>
          <p>Subjects: ${Object.values(cls.subjects || {}).join(", ")}</p>
          <p>Students: ${Object.keys(cls.students || {}).length}</p>
          <button onclick="showClassDetail('${c.key}')">Open</button>
        `;
        list.appendChild(card);
      });
    });
  });
}

// ---------------- CLASS DETAIL ----------------
function showClassDetail(classId) {
  closeSidebar();
  mainView.innerHTML = `
    <h2>Mark Attendance</h2>
    <div class="card">
      <input type="date" id="att-date">
      <button onclick="markAttendance('${classId}')">Save Attendance</button>
    </div>
    <div class="card-grid" id="student-list"></div>
  `;

  const list = document.getElementById("student-list");

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    if (!snap.exists()) {
      list.innerHTML = "<p>No students found.</p>";
      return;
    }

    snap.forEach(s => {
      db.ref(`users/${s.key}`).once("value").then(usnap => {
        const stu = usnap.val();
        if (!stu) return;

        const card = document.createElement("div");
        card.className = "card student-card";
        card.id = `card-${s.key}`;
        card.innerHTML = `
          <h4>${stu.name}</h4>
          <select id="status-${s.key}" onchange="highlight('${s.key}')">
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        `;
        list.appendChild(card);
      });
    });
  });
}

// ---------------- MARK ATTENDANCE ----------------
function markAttendance(classId) {
  const date = document.getElementById("att-date").value;
  if (!date) {
    showToast("Select date!", "error");
    return;
  }

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    snap.forEach(s => {
      const status = document.getElementById(`status-${s.key}`).value;
      db.ref(`classes/${classId}/attendance/${date}/${s.key}`).set(status);
    });
    showToast("Attendance saved!");
  });
}

// ---------------- HIGHLIGHT ----------------
function highlight(sid) {
  const card = document.getElementById(`card-${sid}`);
  const status = document.getElementById(`status-${sid}`).value;
  card.classList.toggle("present", status === "present");
  card.classList.toggle("absent", status === "absent");
}

// ---------------- UTIL ----------------
function createCard(title, value) {
  const c = document.createElement("div");
  c.className = "card overview-card";
  c.innerHTML = `<h3>${title}</h3><p>${value}</p>`;
  return c;
          }
