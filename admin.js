// ================= GLOBAL =================
const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("main-view");

let currentAdmin = null;

// ================= SIDEBAR =================
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ================= LOGOUT =================
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ================= AUTH =================
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  currentAdmin = user.uid;
  setAdminName();
  showDashboard();
});

// ================= ADMIN NAME =================
function setAdminName() {
  const title = document.querySelector(".topbar h1");

  db.ref("users/" + currentAdmin).once("value").then(snap => {
    const name = snap.exists() ? snap.val().name : "Admin";
    title.innerHTML = `Admin Dashboard <span style="opacity:.8;font-weight:400">- ${name}</span>`;
  });
}

// ================= TOAST =================
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ================= DASHBOARD =================
function showDashboard() {
  closeSidebar();

  mainView.innerHTML = `
    <h2>Dashboard Overview</h2>
    <div class="card-grid" id="overview"></div>
    <canvas id="attendanceChart" style="margin-top:30px"></canvas>
  `;

  db.ref("classes").once("value").then(snap => {
    let totalClasses = snap.exists() ? snap.numChildren() : 0;
    let totalStudents = 0;
    let presentToday = 0;
    const today = new Date().toISOString().split("T")[0];

    snap.forEach(clsSnap => {
      const cls = clsSnap.val();
      totalStudents += Object.keys(cls.students || {}).length;

      const todayAtt = cls.attendance?.[today] || {};
      Object.values(todayAtt).forEach(v => {
        if (v === "present") presentToday++;
      });
    });

    const cards = document.getElementById("overview");
    const kpis = [
      { title: "Total Classes", value: totalClasses },
      { title: "Total Students", value: totalStudents },
      { title: "Attendance Today", value: totalStudents ? Math.round((presentToday / totalStudents) * 100) + "%" : "0%" }
    ];

    cards.innerHTML = "";
    kpis.forEach(k => {
      const c = document.createElement("div");
      c.className = "card overview-card";
      c.innerHTML = `<h3>${k.title}</h3><p>${k.value}</p>`;
      cards.appendChild(c);
    });

    // Chart
    const labels = [];
    const present = [];
    const absent = [];

    snap.forEach(clsSnap => {
      const cls = clsSnap.val();
      labels.push(cls.name);
      let p = 0, a = 0;
      Object.keys(cls.students || {}).forEach(sid => {
        if (cls.attendance?.[today]?.[sid] === "present") p++;
        else a++;
      });
      present.push(p);
      absent.push(a);
    });

    new Chart(document.getElementById("attendanceChart"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Present", data: present, backgroundColor: "#2ecc71" },
          { label: "Absent", data: absent, backgroundColor: "#e74c3c" }
        ]
      },
      options: { responsive: true }
    });
  });
}

// ================= PENDING USERS =================
function showPending() {
  closeSidebar();
  mainView.innerHTML = `<h2>Pending Approvals</h2><div class="card-grid" id="pending"></div>`;

  db.ref("users").once("value").then(snap => {
    const list = document.getElementById("pending");
    list.innerHTML = "";

    snap.forEach(u => {
      const user = u.val();
      if (user.status === "pending") {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${user.name}</h3>
          <p>${user.email}</p>
          <p>Role: ${user.role}</p>
          <button onclick="approveUser('${u.key}')">Approve</button>
          <button onclick="rejectUser('${u.key}')">Reject</button>
        `;
        list.appendChild(card);
      }
    });
  });
}

function approveUser(uid) {
  db.ref("users/" + uid + "/status").set("approved").then(() => {
    showToast("User approved");
    showPending();
  });
}

function rejectUser(uid) {
  db.ref("users/" + uid).remove().then(() => {
    showToast("User rejected", "error");
    showPending();
  });
}

// ================= CLASSES =================
function showClasses() {
  closeSidebar();

  mainView.innerHTML = `
    <h2>Classes</h2>
    <button onclick="createClassForm()">➕ Create Class</button>
    <div class="card-grid" id="class-list"></div>
  `;

  loadClasses();
}

function loadClasses() {
  const list = document.getElementById("class-list");
  list.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(clsSnap => {
      const cls = clsSnap.val();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${cls.name}</h3>
        <p>Subjects: ${Object.values(cls.subjects || {}).join(", ")}</p>
        <button onclick="editClass('${clsSnap.key}')">Edit</button>
        <button onclick="deleteClass('${clsSnap.key}')">Delete</button>
      `;
      list.appendChild(card);
    });
  });
}
function loadClassesForAssign() {
  const classSelect = document.getElementById("assign-class");
  classSelect.innerHTML = `<option value="">Select Class</option>`;

  db.ref("classes").once("value").then(snap => {
    snap.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.key;
      opt.textContent = c.val().name;
      classSelect.appendChild(opt);
    });
  });

  classSelect.onchange = loadSubjectsForAssign;
}
function loadSubjectsForAssign() {
  const classId = document.getElementById("assign-class").value;
  const subjectSelect = document.getElementById("assign-subject");

  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  if (!classId) return;

  db.ref(`classes/${classId}/subjects`).once("value").then(snap => {
    snap.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.key;
      opt.textContent = s.val();
      subjectSelect.appendChild(opt);
    });
  });
}
function loadTeachersForAssign() {
  const teacherSelect = document.getElementById("assign-teacher");
  teacherSelect.innerHTML = `<option value="">Select Teacher</option>`;

  db.ref("users").once("value").then(snap => {
    snap.forEach(u => {
      if (u.val().role === "teacher") {
        const opt = document.createElement("option");
        opt.value = u.key;
        opt.textContent = u.val().name;
        teacherSelect.appendChild(opt);
      }
    });
  });
}
function assignSubjectUI() {
  const classId = document.getElementById("assign-class").value;
  const subjectId = document.getElementById("assign-subject").value;
  const teacherId = document.getElementById("assign-teacher").value;

  if (!classId || !subjectId || !teacherId) {
    alert("Please select all fields");
    return;
  }

  // 1️⃣ Assign subject → teacher
  db.ref(`classSubjects/${classId}/${subjectId}`).set({
    teacherId,
    assignedAt: Date.now()
  });

  // 2️⃣ Save in teacher profile
  db.ref(`users/${teacherId}/assignments/${classId}_${subjectId}`).set(true);

  alert("✅ Subject assigned successfully");
}
// ================= CREATE CLASS =================
function createClassForm() {
  closeSidebar();

  mainView.innerHTML = `
    <h2>Create Class</h2>
    <div class="card">
      <input id="class-name" placeholder="Class name" />
      <select id="class-teacher"></select>
      <input id="class-subjects" placeholder="Subjects (comma separated)" />
      <button onclick="createClass()">Create</button>
      <button onclick="showClasses()">Back</button>
    </div>
  `;

  const sel = document.getElementById("class-teacher");
  db.ref("users").once("value").then(snap => {
    snap.forEach(u => {
      if (u.val().role === "teacher") {
        const opt = document.createElement("option");
        opt.value = u.key;
        opt.textContent = u.val().name;
        sel.appendChild(opt);
      }
    });
  });
}

function createClass() {
  const name = document.getElementById("class-name").value.trim();
  const teacher = document.getElementById("class-teacher").value;
  const subjectsArr = document.getElementById("class-subjects").value
    .split(",").map(s => s.trim()).filter(Boolean);

  if (!name || !teacher || subjectsArr.length === 0) {
    showToast("Fill all fields", "error");
    return;
  }

  const subjects = {};
  subjectsArr.forEach((s, i) => subjects["subject" + (i + 1)] = s);

  const ref = db.ref("classes").push();
  ref.set({ name, teacher, subjects, students: {}, attendance: {} }).then(() => {
    db.ref(`users/${teacher}/classes/${ref.key}`).set(true);
    showToast("Class created");
    showClasses();
  });
}
function assignSubject(classId, subjectId, teacherId) {
  // 1️⃣ Link subject to class
  db.ref(`classSubjects/${classId}/${subjectId}`).set({
    teacherId
  });

  // 2️⃣ Add assignment to teacher
  db.ref(`users/${teacherId}/assignments/${classId}_${subjectId}`).set(true);
}
function showAssignSubject() {
  closeSidebar();

  mainView.innerHTML = `
    <h2>🎓 Assign Subject to Teacher</h2>

    <div class="card">
      <label>Class</label>
      <select id="assign-class"></select>

      <label>Subject</label>
      <select id="assign-subject"></select>

      <label>Teacher</label>
      <select id="assign-teacher"></select>

      <button onclick="assignSubjectUI()">✅ Assign</button>
    </div>
  `;

  loadClassesForAssign();
  loadTeachersForAssign();
}
// ================= EDIT CLASS =================
function editClass(classId) {
  closeSidebar();

  db.ref("classes/" + classId).once("value").then(snap => {
    const cls = snap.val();
    mainView.innerHTML = `
      <h2>Edit Class</h2>
      <div class="card">
        <input id="edit-name" value="${cls.name}" />
        <input id="edit-subjects" value="${Object.values(cls.subjects || {}).join(", ")}" />
        <button onclick="updateClass('${classId}')">Save</button>
        <button onclick="showClasses()">Back</button>
      </div>
    `;
  });
}

function updateClass(classId) {
  const name = document.getElementById("edit-name").value.trim();
  const subjectsArr = document.getElementById("edit-subjects").value
    .split(",").map(s => s.trim()).filter(Boolean);

  const subjects = {};
  subjectsArr.forEach((s, i) => subjects["subject" + (i + 1)] = s);

  db.ref("classes/" + classId).update({ name, subjects }).then(() => {
    showToast("Class updated");
    showClasses();
  });
}

function deleteClass(id) {
  if (!confirm("Delete class?")) return;
  db.ref("classes/" + id).remove().then(() => {
    showToast("Class deleted", "error");
    showClasses();
  });
}

// ================= TEACHERS =================
function showTeachers() {
  closeSidebar();

  mainView.innerHTML = `<h2>Teachers</h2><div class="card-grid" id="teachers"></div>`;
  const list = document.getElementById("teachers");

  db.ref("users").once("value").then(snap => {
    snap.forEach(u => {
      if (u.val().role === "teacher") {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${u.val().name}</h3>
          <p>${u.val().email}</p>
          <button onclick="viewTeacher('${u.key}')">View</button>
        `;
        list.appendChild(card);
      }
    });
  });
}

function viewTeacher(uid) {
  closeSidebar();

  Promise.all([
    db.ref("users/" + uid).once("value"),
    db.ref("classes").once("value")
  ]).then(([uSnap, cSnap]) => {

    let options = "";
    cSnap.forEach(c => {
      options += `<option value="${c.key}">${c.val().name}</option>`;
    });

    mainView.innerHTML = `
      <h2>Teacher</h2>
      <div class="card">
        <h3>${uSnap.val().name}</h3>
        <p>${uSnap.val().email}</p>
      </div>
      <div class="card">
        <select id="assign-class">${options}</select>
        <button onclick="assignClass('${uid}')">Assign Class</button>
      </div>
      <button onclick="showTeachers()">Back</button>
    `;
  });
}

function assignClass(uid) {
  const classId = document.getElementById("assign-class").value;
  db.ref(`users/${uid}/classes/${classId}`).set(true).then(() => {
    showToast("Class assigned");
  });
}

// ================= SETTINGS =================
function showSettings() {
  closeSidebar();

  mainView.innerHTML = `
    <h2>Settings</h2>
    <div class="card">
      <p>Smart Attendance System</p>
      <p>Version 1.0</p>
      <button onclick="resetAttendance()">Reset Today Attendance</button>
    </div>
  `;
}

function resetAttendance() {
  if (!confirm("Reset attendance?")) return;
  const today = new Date().toISOString().split("T")[0];

  db.ref("classes").once("value").then(snap => {
    snap.forEach(cls => {
      db.ref(`classes/${cls.key}/attendance/${today}`).remove();
    });
    showToast("Attendance reset");
  });
          }
