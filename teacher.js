// ----- GLOBAL REFS -----
const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("main-view");

let currentTeacher = null;

// ----- SIDEBAR -----
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
  auth.signOut().then(() => {
    location.href = "login.html";
  });
}

// ----- AUTH -----
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  currentTeacher = user.uid;
  loadTeacherName();
  showDashboard();
});

// ----- TEACHER NAME -----
function loadTeacherName() {
  db.ref(`users/${currentTeacher}`).once("value").then(snap => {
    document.getElementById("teacher-name").textContent = snap.val()?.name || "Teacher";
  });
}

// ----- DASHBOARD -----
function showDashboard() {
  closeSidebar();
  mainView.innerHTML = `
    <h2>Dashboard</h2>
    <div class="card-grid" id="dash-cards"></div>
  `;

  const grid = document.getElementById("dash-cards");

  db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
    const totalClasses = snap.numChildren();

    let totalStudents = 0;
    let todayPresent = 0;
    const today = new Date().toISOString().split("T")[0];

    if (!snap.exists()) {
      grid.innerHTML = `<p>No classes assigned</p>`;
      return;
    }

    let processed = 0;

    snap.forEach(c => {
      db.ref(`classes/${c.key}`).once("value").then(csnap => {
        const cls = csnap.val();
        const students = cls.students || {};
        totalStudents += Object.keys(students).length;

        const att = cls.attendance?.[today] || {};
        Object.values(att).forEach(v => {
          if (v === "present") todayPresent++;
        });

        processed++;

        if (processed === totalClasses) {
          grid.innerHTML = `
            <div class="card"><h3>📚 Classes</h3><p>${totalClasses}</p></div>
            <div class="card"><h3>👩‍🎓 Students</h3><p>${totalStudents}</p></div>
            <div class="card"><h3>📝 Attendance</h3><p>${totalStudents ? Math.round((todayPresent / totalStudents) * 100) : 0}%</p></div>
          `;
        }
      });
    });
  });
}

// ----- CLASSES -----
function showClasses() {
  closeSidebar();
  mainView.innerHTML = `<h2>My Classes</h2><div class="card-grid" id="class-list"></div>`;

  const list = document.getElementById("class-list");

  db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
    if (!snap.exists()) {
      list.innerHTML = "<p>No classes assigned</p>";
      return;
    }

    snap.forEach(c => {
      db.ref(`classes/${c.key}`).once("value").then(csnap => {
        const cls = csnap.val();
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${cls.name}</h3>
          <p>Students: ${Object.keys(cls.students || {}).length}</p>
          <button onclick="showClassDetail('${c.key}')">Open</button>
        `;
        list.appendChild(card);
      });
    });
  });
}

// ----- CLASS DETAIL -----
function showClassDetail(classId) {
  closeSidebar();
  mainView.innerHTML = `
    <h2>Class Attendance</h2>
    <div class="card">
      <input type="date" id="att-date">
      <button onclick="markAttendance('${classId}')">Save Attendance</button>
    </div>
    <div class="card-grid" id="student-list"></div>
  `;

  const list = document.getElementById("student-list");

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    snap.forEach(s => {
      db.ref(`users/${s.key}`).once("value").then(ssnap => {
        const stu = ssnap.val();
        const card = document.createElement("div");
        card.className = "card";
        card.id = `stu-${s.key}`;
        card.innerHTML = `
          <h4>${stu.name}</h4>
          <select id="status-${s.key}">
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        `;
        list.appendChild(card);
      });
    });
  });
}

// ----- ATTENDANCE -----
function markAttendance(classId) {
  const date = document.getElementById("att-date").value;
  if (!date) {
    alert("Select date");
    return;
  }

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    snap.forEach(s => {
      const status = document.getElementById(`status-${s.key}`).value;
      db.ref(`classes/${classId}/attendance/${date}/${s.key}`).set(status);
    });
    alert("Attendance saved");
  });
}

// ----- DEFAULTERS -----
function showDefaulters() {
  closeSidebar();
  mainView.innerHTML = `<h2>Defaulters</h2><div class="card-grid" id="def-list"></div>`;
  const list = document.getElementById("def-list");

  db.ref("settings/minAttendancePercent").once("value").then(ms => {
    const min = ms.val() || 75;

    db.ref(`users/${currentTeacher}/classes`).once("value").then(snap => {
      snap.forEach(c => {
        db.ref(`classes/${c.key}`).once("value").then(csnap => {
          const cls = csnap.val();
          const att = cls.attendance || {};
          const days = Object.keys(att).length || 1;

          Object.keys(cls.students || {}).forEach(sid => {
            let present = 0;
            Object.values(att).forEach(d => {
              if (d[sid] === "present") present++;
            });

            const percent = Math.round((present / days) * 100);
            if (percent < min) {
              db.ref(`users/${sid}`).once("value").then(ss => {
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                  <h4>${ss.val().name}</h4>
                  <p>${percent}% attendance</p>
                `;
                list.appendChild(card);
              });
            }
          });
        });
      });
    });
  });
}
