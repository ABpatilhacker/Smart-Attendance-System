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
  showClasses();
});

// ----- SET TEACHER NAME -----
function setTeacherName() {
  db.ref(`users/${currentTeacher}`).once("value").then(snap => {
    document.getElementById("teacher-name").textContent = snap.val().name;
  });
}

// ----- SHOW CLASSES DASHBOARD -----
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
        card.className = "card";
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

// ----- SHOW CLASS DETAIL -----
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
        card.innerHTML = `
          <h4>${stu.name}</h4>
          <p>Email: ${stu.email}</p>
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

// ----- MARK ATTENDANCE -----
function markAttendance(classId) {
  const date = document.getElementById("att-date").value;
  if (!date) return alert("Select date!");

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    snap.forEach(s => {
      const status = document.getElementById(`status-${s.key}`).value;
      db.ref(`classes/${classId}/attendance/${date}/${s.key}`).set(status);
    });
    alert("Attendance marked!");
    showClassDetail(classId); // Refresh list with selected date
  });
}

// ----- SHOW DEFAULTERS -----
function showDefaulters() {
  closeSidebar();
  mainView.innerHTML = `<h2>Defaulters</h2>
    <div id="defaulters-list" class="card-grid"></div>
  `;

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
