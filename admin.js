/***********************
 🔥 FIREBASE INIT
************************/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/***********************
 🧩 SAFE DOM GETTER
************************/
const $ = id => document.getElementById(id);

/***********************
 🧩 DOM REFERENCES
************************/
const classCount = $("classCount");
const teacherCount = $("teacherCount");
const studentCount = $("studentCount");

const classList = $("classList");
const teacherList = $("teacherList");
const pendingList = $("pendingList");

const className = $("className");
const minAttendance = $("minAttendance");

const classPanel = $("classPanel");
const teacherProfile = $("teacherProfile");

const modal = $("modal");
const modalTitle = $("modalTitle");
const modalText = $("modalText");
const modalOk = $("modalOk");

/***********************
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "login.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
      return;
    }

    // ✅ ACTIVATE DASHBOARD
    nav("dashboard");

    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  });
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/***********************
 📊 DASHBOARD
************************/
function loadDashboard() {
  db.ref("classes").on("value", s => {
    if (classCount) animateCount(classCount, s.numChildren());
  });

  db.ref("users").on("value", s => {
    let t = 0, st = 0;
    s.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") t++;
        if (u.val().role === "student") st++;
      }
    });
    if (teacherCount) animateCount(teacherCount, t);
    if (studentCount) animateCount(studentCount, st);
  });
}

/***********************
 🟡 APPROVALS
************************/
function loadApprovals() {
  if (!pendingList) return;

  db.ref("users").on("value", snap => {
    pendingList.innerHTML = "";
    let found = false;

    snap.forEach(u => {
      const d = u.val();
      if (d.approved === false) {
        found = true;
        pendingList.innerHTML += `
          <li>
            <strong>${d.name}</strong>
            <small>${d.email}</small>
            <div class="actions">
              <button onclick="approveUser('${u.key}')">Approve</button>
              <button class="danger" onclick="rejectUser('${u.key}')">Reject</button>
            </div>
          </li>`;
      }
    });

    if (!found)
      pendingList.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true })
    .then(() => toast("Approved ✅"));
}

function rejectUser(uid) {
  confirmModal("Reject User", "Reject this user?", () => {
    db.ref("users/" + uid).remove()
      .then(() => toast("Rejected ❌"));
  });
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  if (!classList) return;

  db.ref("classes").on("value", snap => {
    classList.innerHTML = "";
    snap.forEach(c => {
      classList.innerHTML += `
        <li>
          <strong>${c.val().name}</strong>
          <div class="actions">
            <button onclick="openClassPanel('${c.key}')">View</button>
            <button onclick="editClassPanel('${c.key}')">✏️</button>
            <button class="danger" onclick="deleteClass('${c.key}')">🗑️</button>
          </div>
        </li>`;
    });
  });
}

function addClass() {
  const name = className.value.trim();
  if (!name) return toast("Enter class name");

  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({
    name,
    subjects: {},
    students: {}
  }).then(() => {
    className.value = "";
    toast("Class added ✅");
  });
}

/***********************
 📘 CLASS PANEL
************************/
function openClassPanel(classId) {
  Promise.all([
    db.ref("classes/" + classId).once("value"),
    db.ref("users").once("value")
  ]).then(([cSnap, uSnap]) => {

    const cls = cSnap.val();
    if (!cls) return toast("Class not found");

    const users = uSnap.val() || {};
    const teachers = Object.entries(users)
      .filter(([_, u]) => u.role === "teacher" && u.approved);

    let subjectHTML = "";

    Object.entries(cls.subjects || {}).forEach(([key, sub]) => {
      let options = `<option value="">Unassigned</option>`;
      teachers.forEach(([tid, t]) => {
        options += `<option value="${tid}" ${sub.teacherId === tid ? "selected" : ""}>${t.name}</option>`;
      });

      subjectHTML += `
        <div class="subject-card">
          <h4>${sub.name}</h4>
          <select id="assign-${key}">${options}</select>
          <button onclick="assignSubject('${classId}','${key}')">Assign</button>
        </div>`;
    });

    classPanel.innerHTML = `
      <h2>${cls.name}</h2>
      ${subjectHTML || "<p class='muted'>No subjects</p>"}
      <button onclick="closePanel('classPanel')">Close</button>
    `;

    openPanel("classPanel");
  });
}

function assignSubject(classId, subjectKey) {
  const sel = document.getElementById("assign-" + subjectKey);
  if (!sel) return;

  db.ref(`classes/${classId}/subjects/${subjectKey}`)
    .update({ teacherId: sel.value })
    .then(() => toast("Subject assigned ✅"));
}

/***********************
 👨‍🏫 TEACHERS
************************/
function loadTeachers() {
  if (!teacherList) return;

  db.ref("users").on("value", snap => {
    teacherList.innerHTML = "";

    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        teacherList.innerHTML += `
          <li>
            <strong>${d.name}</strong>
            <div class="actions">
              <button class="btn ghost" onclick="openTeacherPanel('${u.key}')">View</button>
            </div>
          </li>`;
      }
    });
  });
}

/***********************
 ⚙️ SETTINGS
************************/
function loadSettings() {
  if (!minAttendance) return;
  db.ref("settings").once("value").then(s => {
    minAttendance.value = s.val()?.minAttendance || 75;
  });
}

function saveSettings() {
  const v = Number(minAttendance.value);
  if (v < 0 || v > 100) return toast("Invalid value");
  db.ref("settings").update({ minAttendance: v })
    .then(() => toast("Settings saved"));
}

/***********************
 🧭 NAVIGATION (CRITICAL FIX)
************************/
function nav(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  const sb = document.querySelector(".sidebar");
  if (sb) sb.classList.remove("active");
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content');
  const overlay = document.getElementById('overlay');

  sidebar.classList.toggle('open');
  content.classList.toggle('sidebar-open');
  overlay.classList.toggle('show');
}

/***********************
 📦 PANELS
************************/
function openPanel(id) {
  const p = document.getElementById(id);
  if (p) p.classList.add("active-panel");
}
function closePanel(id) {
  const p = document.getElementById(id);
  if (p) p.classList.remove("active-panel");
}

/***********************
 ❓ MODAL
************************/
function confirmModal(title, text, cb) {
  modalTitle.innerText = title;
  modalText.innerText = text;
  modal.classList.add("show");
  modalOk.onclick = () => {
    modal.classList.remove("show");
    cb();
  };
}

/***********************
 🔔 TOAST
************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/***********************
 🔢 COUNT ANIMATION
************************/
function animateCount(el, target) {
  let start = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.innerText = target;
      clearInterval(timer);
    } else el.innerText = start;
  }, 20);
}
function editClassPanel(classId) {
  Promise.all([
    db.ref("classes/" + classId).once("value"),
    db.ref("users").once("value")
  ]).then(([cSnap, uSnap]) => {

    const cls = cSnap.val();
    const users = uSnap.val() || {};

    const teachers = Object.entries(users)
      .filter(([_, u]) => u.role === "teacher" && u.approved);

    let subjectsHTML = "";

    Object.entries(cls.subjects || {}).forEach(([sid, sub]) => {
      let options = `<option value="">Unassigned</option>`;
      teachers.forEach(([tid, t]) => {
        options += `
          <option value="${tid}" ${sub.teacherId === tid ? "selected" : ""}>
            ${t.name}
          </option>`;
      });

      subjectsHTML += `
        <div class="subject-card">
          <label>${sub.name}</label>
          <select id="edit-${sid}">${options}</select>
        </div>
      `;
    });

    classPanel.innerHTML = `
      <h2>Edit ${cls.name}</h2>

      <label>Class Name</label>
      <input id="editClassName" value="${cls.name}">

      <h3>Assign Teachers</h3>
      ${subjectsHTML || "<p class='muted'>No subjects found</p>"}

      <button class="btn primary" onclick="saveClassEdit('${classId}')">
        Save Changes
      </button>
      <button class="btn secondary" onclick="closePanel('classPanel')">
        Cancel
      </button>
    `;

    openPanel("classPanel");
  });
}
function saveClassEdit(classId) {
  const name = document.getElementById("editClassName").value.trim();
  if (!name) return toast("Class name required");

  const updates = { name };

  db.ref("classes/" + classId + "/subjects").once("value").then(snap => {
    snap.forEach(sub => {
      const sel = document.getElementById("edit-" + sub.key);
      if (sel) {
        updates["subjects/" + sub.key + "/teacherId"] = sel.value || "";
      }
    });

    db.ref("classes/" + classId).update(updates)
      .then(() => {
        toast("Class updated successfully ✅");
        closePanel("classPanel");
      });
  });
       }

function openTeacherPanel(uid) {
  Promise.all([
    db.ref("users/" + uid).once("value"),
    db.ref("classes").once("value")
  ]).then(([uSnap, cSnap]) => {

    const teacher = uSnap.val();
    let assigned = [];

    cSnap.forEach(cls => {
      const subjects = cls.val().subjects || {};
      Object.values(subjects).forEach(s => {
        if (s.teacherId === uid) {
          assigned.push(`${cls.val().name} – ${s.name}`);
        }
      });
    });

    teacherProfile.innerHTML = `
      <h2>${teacher.name}</h2>
      <p class="muted">${teacher.email}</p>

      <h3>Assigned Subjects</h3>
      ${assigned.length
        ? `<ul>${assigned.map(a => `<li>${a}</li>`).join("")}</ul>`
        : `<p class="muted">No assignments yet</p>`}

      <button class="btn ghost" onclick="closePanel('teacherProfile')">Close</button>
    `;

    openPanel("teacherProfile");
  });
            }
