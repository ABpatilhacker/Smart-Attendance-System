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
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  }
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

/***********************
 📊 DASHBOARD
************************/
function loadDashboard() {
  db.ref("classes").on("value", s => {
    classCount.innerText = s.numChildren();
  });

  db.ref("users").on("value", s => {
    let t = 0, st = 0;
    s.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") t++;
        if (u.val().role === "student") st++;
      }
    });
    teacherCount.innerText = t;
    studentCount.innerText = st;
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
          <li class="approval-card">
            <strong>${d.name}</strong>
            <small>${d.email}</small>
            <span class="badge">${d.role}</span>
            <div class="actions">
              <button onclick="approveUser('${u.key}')">Approve</button>
              <button class="danger" onclick="rejectUser('${u.key}')">Reject</button>
            </div>
          </li>`;
      }
    });

    if (!found) pendingList.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true })
    .then(() => toast("User approved ✅"));
}

function rejectUser(uid) {
  confirmModal("Reject User", "Reject this user?", () => {
    db.ref("users/" + uid).remove()
      .then(() => toast("User rejected ❌"));
  });
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  if (!classList) return;

  classList.innerHTML = "";

  db.ref("classes").on("value", snap => {
    classList.innerHTML = "";

    snap.forEach(c => {
      classList.innerHTML += `
        <li class="class-card">
          <strong>${c.val().name}</strong>
          <div class="actions">
            <button onclick="openClassDetails('${c.key}')">View</button>
            <button onclick="editClass('${c.key}','${c.val().name}')">✏️</button>
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

function openClassDetails(id) {
  db.ref("classes/" + id).once("value").then(snap => {
    const c = snap.val();

    db.ref("users").once("value").then(users => {
      let subjects = "";
      if (c.subjects) {
        Object.values(c.subjects).forEach(s => {
          const t = users.val()[s.teacherId];
          subjects += `<li>${s.name} <small>${t ? t.name : "Unassigned"}</small></li>`;
        });
      }

      let students = "";
      Object.keys(c.students || {}).forEach(uid => {
        const st = users.val()[uid];
        if (st) students += `<li>${st.roll} - ${st.name}</li>`;
      });

      classPanel.innerHTML = `
        <h2>${c.name}</h2>
        <h4>Subjects</h4>
        <ul>${subjects || "<li>No subjects</li>"}</ul>
        <h4>Students</h4>
        <ul>${students || "<li>No students</li>"}</ul>
        <button onclick="closePanel('classPanel')">Close</button>
      `;

      openPanel("classPanel");
    });
  });
}

function editClass(id, oldName) {
  const name = prompt("Edit class name:", oldName);
  if (!name) return;
  db.ref("classes/" + id).update({ name })
    .then(() => toast("Class updated"));
}

function deleteClass(id) {
  confirmModal("Delete Class", "Are you sure?", () => {
    db.ref("classes/" + id).remove()
      .then(() => toast("Class deleted"));
  });
}

/***********************
 👨‍🏫 TEACHERS
************************/
function loadTeachers() {
  if (!teacherList) return;

  teacherList.innerHTML = "";

  db.ref("users").on("value", snap => {
    teacherList.innerHTML = "";

    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        teacherList.innerHTML += `
          <li class="teacher-card">
            <span>${d.email}</span>
            <div class="actions">
              <button onclick="openTeacherProfile('${u.key}')">View</button>
              <button onclick="editTeacher('${u.key}','${d.name}','${d.email}')">✏️</button>
              <button class="danger" onclick="deleteTeacher('${u.key}')">🗑️</button>
            </div>
          </li>`;
      }
    });
  });
}

function addTeacher() {
  const name = teacherName.value.trim();
  const email = teacherEmail.value.trim();
  if (!name || !email) return toast("Fill all fields");

  const uid = db.ref("users").push().key;
  db.ref("users/" + uid).set({
    name,
    email,
    role: "teacher",
    approved: true
  }).then(() => toast("Teacher added ✅"));
}

function openTeacherProfile(uid) {
  db.ref("users/" + uid).once("value").then(s => {
    const t = s.val();
    teacherProfile.innerHTML = `
      <h2>${t.name}</h2>
      <p>${t.email}</p>
      <button onclick="closePanel('teacherProfile')">Close</button>
    `;
    openPanel("teacherProfile");
  });
}

function editTeacher(uid, oldName, oldEmail) {
  const name = prompt("Edit name:", oldName);
  const email = prompt("Edit email:", oldEmail);
  if (!name || !email) return;
  db.ref("users/" + uid).update({ name, email })
    .then(() => toast("Teacher updated"));
}

function deleteTeacher(uid) {
  confirmModal("Delete Teacher", "Are you sure?", () => {
    db.ref("users/" + uid).remove()
      .then(() => toast("Teacher deleted"));
  });
}

/***********************
 ⚙️ SETTINGS
************************/
function loadSettings() {
  db.ref("settings/minAttendance").once("value", s => {
    if (s.exists()) minAttendance.value = s.val();
  });
}

function saveSettings() {
  const val = minAttendance.value;
  if (!val) return toast("Enter value");
  db.ref("settings").update({ minAttendance: Number(val) })
    .then(() => toast("Settings saved ✅"));
}

/***********************
 🌟 UI HELPERS
************************/
function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function nav(id) {
  showPage(id);
  closeSidebar();
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/***********************
 📦 PANEL
************************/
function openPanel(id) {
  document.getElementById(id).classList.add("active-panel");
  document.body.classList.add("panel-open");
}

function closePanel(id) {
  document.getElementById(id).classList.remove("active-panel");
  document.body.classList.remove("panel-open");
}

/***********************
 ❓ MODAL
************************/
function confirmModal(title, text, onConfirm) {
  modalTitle.innerText = title;
  modalText.innerText = text;
  modal.classList.add("show");
  modalOk.onclick = () => {
    closeModal();
    onConfirm();
  };
}

function closeModal() {
  modal.classList.remove("show");
}

/***********************
 🔔 TOAST
************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 100);
  setTimeout(() => t.remove(), 3500);
}
/* =======================
   SIDEBAR FIX (JS SAFE)
======================= */

/* Desktop – always visible */
@media (min-width: 901px) {
  .sidebar {
    transform: translateX(0) !important;
  }
}

/* Mobile – controlled by body.sidebar-open */
@media (max-width: 900px) {
  body.sidebar-open .sidebar {
    transform: translateX(0);
  }

  body.sidebar-open .content {
    filter: blur(4px);
    pointer-events: none;
  }
}
