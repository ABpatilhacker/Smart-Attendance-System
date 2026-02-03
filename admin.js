/***********************
 🔥 FIREBASE INIT
************************/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/***********************
 🔐 AUTH CHECK (SAFE)
************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
      return;
    }

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

function openClassPanel(id) {
  db.ref("classes/" + id).once("value").then(snap => {
    const c = snap.val();
    classPanel.innerHTML = `
      <h2>${c.name}</h2>
      <p class="muted">Subjects & Students overview</p>
      <pre>${JSON.stringify(c, null, 2)}</pre>
      <button onclick="closePanel('classPanel')">Close</button>
    `;
    openPanel("classPanel");
  });
}

function editClassPanel(id) {
  db.ref("classes/" + id).once("value").then(snap => {
    const c = snap.val();
    classPanel.innerHTML = `
      <h2>Edit ${c.name}</h2>
      <label>Class Name</label>
      <input id="editClassName" value="${c.name}">
      <button onclick="saveClassEdit('${id}')">Save</button>
    `;
    openPanel("classPanel");
  });
}

function saveClassEdit(id) {
  const name = document.getElementById("editClassName").value.trim();
  if (!name) return toast("Invalid name");

  db.ref("classes/" + id).update({ name })
    .then(() => {
      toast("Class updated");
      closePanel("classPanel");
    });
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

  db.ref("users").on("value", snap => {
    teacherList.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        teacherList.innerHTML += `
          <li>
            <span>${d.name}<br><small>${d.email}</small></span>
            <div class="actions">
              <button onclick="openTeacherPanel('${u.key}')">View</button>
              <button onclick="editTeacherPanel('${u.key}')">✏️</button>
              <button class="danger" onclick="deleteTeacher('${u.key}')">🗑️</button>
            </div>
          </li>`;
      }
    });
  });
}

function addTeacher() {
  teacherProfile.innerHTML = `
    <h2>Add Teacher</h2>
    <label>Name</label><input id="tName">
    <label>Email</label><input id="tEmail">
    <label>Password</label><input id="tPass" type="password">
    <button onclick="createTeacher()">Create</button>
  `;
  openPanel("teacherProfile");
}

function createTeacher() {
  const name = tName.value.trim();
  const email = tEmail.value.trim();
  const pass = tPass.value;

  if (!name || !email || pass.length < 6)
    return toast("Fill all fields");

  auth.createUserWithEmailAndPassword(email, pass)
    .then(res => db.ref("users/" + res.user.uid).set({
      name, email, role: "teacher", approved: true, assignments: {}
    }))
    .then(() => {
      toast("Teacher created ✅");
      closePanel("teacherProfile");
    })
    .catch(e => toast(e.message));
}

function openTeacherPanel(uid) {
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

function editTeacherPanel(uid) {
  db.ref("users/" + uid).once("value").then(s => {
    const t = s.val();
    teacherProfile.innerHTML = `
      <h2>Edit Teacher</h2>
      <label>Name</label><input id="etName" value="${t.name}">
      <label>Email</label><input id="etEmail" value="${t.email}">
      <button onclick="saveTeacherEdit('${uid}')">Save</button>
    `;
    openPanel("teacherProfile");
  });
}

function saveTeacherEdit(uid) {
  const name = etName.value.trim();
  const email = etEmail.value.trim();
  if (!name || !email) return toast("Invalid input");

  db.ref("users/" + uid).update({ name, email })
    .then(() => {
      toast("Teacher updated");
      closePanel("teacherProfile");
    });
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
  db.ref("settings").once("value").then(s => {
    minAttendance.value = s.val()?.minAttendance || 75;
  });
}

function saveSettings() {
  const val = Number(minAttendance.value);
  if (val < 0 || val > 100) return toast("Invalid percentage");

  db.ref("settings").update({ minAttendance: val })
    .then(() => toast("Settings saved"));
}

/***********************
 🧭 UI HELPERS
************************/
function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}
function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}
function nav(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

/***********************
 📦 PANELS (FIXED)
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
  setTimeout(() => t.remove(), 3000);
}
