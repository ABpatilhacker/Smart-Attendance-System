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
    classCount && animateCount(classCount, s.numChildren());
  });

  db.ref("users").on("value", s => {
    let t = 0, st = 0;
    s.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") t++;
        if (u.val().role === "student") st++;
      }
    });
    teacherCount && animateCount(teacherCount, t);
    studentCount && animateCount(studentCount, st);
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

    if (!found) {
      pendingList.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
    }
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
 📘 VIEW CLASS PANEL
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

    let html = "";

    Object.entries(cls.subjects || {}).forEach(([sid, sub]) => {
      let options = `<option value="">Unassigned</option>`;
      teachers.forEach(([tid, t]) => {
        options += `<option value="${tid}" ${sub.teacherId === tid ? "selected" : ""}>${t.name}</option>`;
      });

      html += `
        <div class="subject-card">
          <span class="badge">📘 ${sub.name}</span>
          <select id="assign-${sid}">${options}</select>
          <button onclick="assignSubject('${classId}','${sid}')">Assign</button>
        </div>`;
    });

    classPanel.innerHTML = `
      <h2>${cls.name}</h2>

      ${html || `
        <p class="muted">No subjects yet</p>
        <input id="newSubjectName" placeholder="Subject name">
        <button onclick="addSubject('${classId}')">➕ Add Subject</button>
      `}

      <button class="ghost" onclick="closePanel()">Close</button>
    `;

    openPanel();
  });
}

/***********************
 ➕ ADD SUBJECT
************************/
function addSubject(classId) {
  const input = $("newSubjectName");
  if (!input || !input.value.trim()) return toast("Enter subject name");

  const key = input.value.toLowerCase().replace(/\s+/g, "");
  db.ref(`classes/${classId}/subjects/${key}`).set({
    name: input.value,
    teacherId: ""
  }).then(() => {
    toast("Subject added ✅");
    openClassPanel(classId);
  });
}

function assignSubject(classId, subjectKey) {
  const sel = $("assign-" + subjectKey);
  if (!sel) return;

  db.ref(`classes/${classId}/subjects/${subjectKey}`)
    .update({ teacherId: sel.value })
    .then(() => toast("Assigned ✅"));
}

/***********************
 ✏️ EDIT CLASS
************************/
function editClassPanel(classId) {
  db.ref("classes/" + classId).once("value").then(snap => {
    const cls = snap.val();
    if (!cls) return;

    let subjects = "";
    Object.entries(cls.subjects || {}).forEach(([sid, sub]) => {
      subjects += `
        <div class="subject-card">
          <span class="badge">${sub.name}</span>
        </div>`;
    });

    classPanel.innerHTML = `
      <h2>Edit ${cls.name}</h2>
      <input id="editClassName" value="${cls.name}">
      ${subjects || "<p class='muted'>No subjects</p>"}
      <button onclick="saveClassEdit('${classId}')">Save</button>
      <button class="ghost" onclick="closePanel()">Cancel</button>
    `;

    openPanel();
  });
}

function saveClassEdit(classId) {
  const name = $("editClassName").value.trim();
  if (!name) return toast("Name required");

  db.ref("classes/" + classId).update({ name })
    .then(() => {
      toast("Updated ✅");
      closePanel();
    });
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
            <button onclick="openTeacherPanel('${u.key}')">View</button>
          </li>`;
      }
    });
  });
}

function openTeacherPanel(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const t = snap.val();
    classPanel.innerHTML = `
      <h2>${t.name}</h2>
      <p class="muted">${t.email}</p>
      <button onclick="closePanel()">Close</button>
    `;
    openPanel();
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
 🧭 NAV + SIDEBAR
************************/
function nav(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(id)?.classList.add("active");
  document.querySelector(".sidebar")?.classList.remove("open");
}

function toggleSidebar() {
  document.querySelector(".sidebar")?.classList.toggle("open");
}

/***********************
 📦 PANEL
************************/
function openPanel() {
  classPanel.classList.add("active-panel");
}

function closePanel() {
  classPanel.classList.remove("active-panel");
}

/***********************
 ❓ MODAL
************************/
function confirmModal(title, text, cb) {
  modalTitle.innerText = title;
  modalText.innerText = text;
  modal.style.display = "flex";
  modalOk.onclick = () => {
    modal.style.display = "none";
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
  let i = 0;
  const step = Math.max(1, target / 30);
  const timer = setInterval(() => {
    i += step;
    if (i >= target) {
      el.innerText = target;
      clearInterval(timer);
    } else el.innerText = Math.floor(i);
  }, 20);
}
