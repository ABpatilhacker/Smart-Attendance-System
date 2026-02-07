/********************************
 🔥 FIREBASE INIT
*********************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.appspot.com",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/********************************
 🧩 SAFE SELECTOR
*********************************/
const $ = id => document.getElementById(id);

/********************************
 🌍 GLOBAL STATE
*********************************/
let currentAdmin = null;

/********************************
 🔐 AUTH CHECK
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "index.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    const u = snap.val();
    if (!u || u.role !== "admin") {
      auth.signOut();
      location.href = "index.html";
      return;
    }

    currentAdmin = user;
    nav("dashboard");
    loadDashboard();
    loadClasses();
    loadTeachers();
    loadApprovals();
    loadSettings();
  });
});

/********************************
 🚪 LOGOUT
*********************************/
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/********************************
 📂 SIDEBAR NAV
*********************************/
function nav(id) {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active")
  );
  $(id)?.classList.add("active");
  document.querySelector(".sidebar")?.classList.remove("open");
}

function toggleSidebar() {
  document.querySelector(".sidebar")?.classList.toggle("open");
}

/********************************
 📊 DASHBOARD
*********************************/
function loadDashboard() {
  db.ref("classes").on("value", s => {
    animateCount($("classCount"), s.exists() ? s.numChildren() : 0);
  });

  db.ref("users").on("value", s => {
    let t = 0, st = 0;
    s.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") t++;
        if (u.val().role === "student") st++;
      }
    });
    animateCount($("teacherCount"), t);
    animateCount($("studentCount"), st);
  });
}

/********************************
 🏫 CLASSES
*********************************/
function loadClasses() {
  const list = $("classList");
  if (!list) return;

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      list.innerHTML += `
        <li>
          <strong>${c.val().name}</strong>
          <div class="actions">
            <button onclick="openClassPanel('${c.key}')">View</button>
            <button onclick="editClassPanel('${c.key}')">✏️</button>
            <button class="danger" onclick="deleteClass('${c.key}')">🗑️</button>
          </div>
        </li>
      `;
    });
  });
}

function addClass() {
  const name = $("className").value.trim();
  if (!name) return toast("Enter class name");

  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({
    name,
    subjects: {},
    students: {}
  }).then(() => {
    $("className").value = "";
    toast("Class added ✅");
  });
}

function deleteClass(id) {
  confirmModal("Delete Class", "This cannot be undone", () => {
    db.ref("classes/" + id).remove().then(() =>
      toast("Class deleted ❌")
    );
  });
}

/********************************
 📘 CLASS VIEW PANEL
*********************************/
function openClassPanel(classId) {
  Promise.all([
    db.ref("classes/" + classId).once("value"),
    db.ref("users").once("value")
  ]).then(([cSnap, uSnap]) => {
    const cls = cSnap.val();
    if (!cls) return toast("Class not found");

    const teachers = Object.entries(uSnap.val() || {})
      .filter(([_, u]) => u.role === "teacher" && u.approved);

    let html = "";
    Object.entries(cls.subjects || {}).forEach(([sid, sub]) => {
      let opts = `<option value="">Unassigned</option>`;
      teachers.forEach(([tid, t]) => {
        opts += `<option value="${tid}" ${sub.teacherId === tid ? "selected" : ""}>${t.name}</option>`;
      });

      html += `
        <div class="subject-card">
          <span class="badge">📘 ${sub.name}</span>
          <select id="assign-${sid}">${opts}</select>
          <button onclick="assignSubject('${classId}','${sid}')">Assign</button>
        </div>
      `;
    });

    $("classPanel").innerHTML = `
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

function assignSubject(classId, sid) {
  const sel = $("assign-" + sid);
  if (!sel) return;
  db.ref(`classes/${classId}/subjects/${sid}`)
    .update({ teacherId: sel.value })
    .then(() => toast("Assigned ✅"));
}

/********************************
 ✏️ EDIT CLASS
*********************************/
function editClassPanel(classId) {
  db.ref("classes/" + classId).once("value").then(snap => {
    const cls = snap.val();
    if (!cls) return;

    let subs = "";
    Object.values(cls.subjects || {}).forEach(s => {
      subs += `<div class="subject-card"><span>${s.name}</span></div>`;
    });

    $("classPanel").innerHTML = `
      <h2>Edit ${cls.name}</h2>
      <input id="editClassName" value="${cls.name}">
      ${subs || "<p class='muted'>No subjects</p>"}
      <button onclick="saveClassEdit('${classId}')">Save</button>
      <button class="ghost" onclick="closePanel()">Cancel</button>
    `;
    openPanel();
  });
}

function saveClassEdit(classId) {
  const name = $("editClassName").value.trim();
  if (!name) return toast("Name required");

  db.ref("classes/" + classId).update({ name }).then(() => {
    toast("Updated ✅");
    closePanel();
  });
}

/********************************
 👨‍🏫 TEACHERS
*********************************/
function loadTeachers() {
  const list = $("teacherList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        list.innerHTML += `
          <li>
            <strong>${d.name}</strong>
            <button onclick="openTeacherPanel('${u.key}')">View</button>
          </li>
        `;
      }
    });
  });
}

function openTeacherPanel(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const t = snap.val();
    $("classPanel").innerHTML = `
      <h2>${t.name}</h2>
      <p class="muted">${t.email}</p>
      <button onclick="closePanel()">Close</button>
    `;
    openPanel();
  });
}

/********************************
 ✅ APPROVALS
*********************************/
function loadApprovals() {
  const list = $("pendingList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    let found = false;
    snap.forEach(u => {
      const d = u.val();
      if (d.approved === false) {
        found = true;
        list.innerHTML += `
          <li>
            <strong>${d.name}</strong>
            <div class="actions">
              <button onclick="approveUser('${u.key}')">Approve</button>
              <button class="danger" onclick="rejectUser('${u.key}')">Reject</button>
            </div>
          </li>
        `;
      }
    });
    if (!found) list.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
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

/********************************
 ⚙ SETTINGS
*********************************/
function loadSettings() {
  db.ref("settings").once("value").then(s => {
    $("minAttendance").value = s.val()?.minAttendance || 75;
  });
}

function saveSettings() {
  const v = Number($("minAttendance").value);
  if (v < 0 || v > 100) return toast("Invalid value");
  db.ref("settings").update({ minAttendance: v })
    .then(() => toast("Settings saved"));
}

/********************************
 📦 PANEL
*********************************/
function openPanel() {
  $("classPanel").classList.add("active-panel");
}
function closePanel() {
  $("classPanel").classList.remove("active-panel");
}

/********************************
 ❓ MODAL
*********************************/
function confirmModal(title, text, cb) {
  $("modalTitle").innerText = title;
  $("modalText").innerText = text;
  $("modal").style.display = "flex";
  $("modalOk").onclick = () => {
    $("modal").style.display = "none";
    cb();
  };
}

/********************************
 🔔 TOAST
*********************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/********************************
 🔢 COUNT ANIMATION
*********************************/
function animateCount(el, target) {
  if (!el) return;
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
