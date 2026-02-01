/***********************
 🔥 FIREBASE INIT
************************/
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// 🔐 Secondary auth (CRITICAL FIX)
const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = secondaryApp.auth();

/***********************
 🔐 AUTH CHECK (FINAL + SAFE)
************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  db.ref("users/" + user.uid).once("value")
    .then(snap => {
      if (!snap.exists()) {
        auth.signOut();
        window.location.href = "index.html";
        return;
      }

      const u = snap.val();

      if (u.role !== "admin" || u.approved !== true) {
        alert("Admin access only");
        auth.signOut();
        window.location.href = "index.html";
        return;
      }

      // ✅ SAFE LOAD
      loadDashboard();
      loadApprovals();
      loadClasses();
      loadTeachers();
      loadSettings();
    })
    .catch(() => {
      auth.signOut();
      window.location.href = "index.html";
    });
});

/***********************
 🚪 LOGOUT (FIXED)
************************/
function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

/***********************
 📊 DASHBOARD
************************/
function loadDashboard() {
  db.ref("classes").on("value", s => {
    classCount.innerText = s.exists() ? s.numChildren() : 0;
  });

  db.ref("users").on("value", s => {
    let t = 0, st = 0;
    s.forEach(u => {
      const d = u.val();
      if (d.approved) {
        if (d.role === "teacher") t++;
        if (d.role === "student") st++;
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
      <pre>${JSON.stringify(c, null, 2)}</pre>
      <button onclick="closePanel('classPanel')">Close</button>
    `;
    openPanel("classPanel");
  });
}

function editClassPanel(id) {
  db.ref("classes/" + id).once("value").then(snap => {
    classPanel.innerHTML = `
      <h2>Edit Class</h2>
      <input id="editClassName" value="${snap.val().name}">
      <button onclick="saveClassEdit('${id}')">Save</button>
    `;
    openPanel("classPanel");
  });
}

function saveClassEdit(id) {
  const name = editClassName.value.trim();
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
 👨‍🏫 TEACHERS (SAFE AUTH)
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
            <strong>${d.name}</strong><br>
            <small>${d.email}</small>
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
    <input id="tName" placeholder="Name">
    <input id="tEmail" placeholder="Email">
    <input id="tPass" type="password" placeholder="Password">
    <button onclick="createTeacher()">Create</button>
  `;
  openPanel("teacherProfile");
}

function createTeacher() {
  const name = tName.value.trim();
  const email = tEmail.value.trim();
  const pass = tPass.value;

  if (!name || !email || pass.length < 6)
    return toast("Invalid details");

  secondaryAuth.createUserWithEmailAndPassword(email, pass)
    .then(res => {
      return db.ref("users/" + res.user.uid).set({
        name,
        email,
        role: "teacher",
        approved: true,
        assignments: {}
      });
    })
    .then(() => {
      toast("Teacher created ✅");
      closePanel("teacherProfile");
      secondaryAuth.signOut();
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
      <input id="etName" value="${t.name}">
      <input id="etEmail" value="${t.email}">
      <button onclick="saveTeacherEdit('${uid}')">Save</button>
    `;
    openPanel("teacherProfile");
  });
}

function saveTeacherEdit(uid) {
  db.ref("users/" + uid).update({
    name: etName.value.trim(),
    email: etEmail.value.trim()
  }).then(() => {
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
  db.ref("settings/minAttendance").once("value", s => {
    minAttendance.value = s.exists() ? s.val() : 75;
  });
}

function saveSettings() {
  const val = Number(minAttendance.value);
  if (val < 0 || val > 100) return toast("Invalid value");
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
 📦 PANELS
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
