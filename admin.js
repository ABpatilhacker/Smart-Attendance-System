/***********************
 🔥 FIREBASE INIT
************************/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

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
db.ref("classes").on("value", s => {
  animateCount(classCount, s.numChildren());
});

db.ref("users").on("value", s => {
  let t = 0, st = 0;
  s.forEach(u => {
    if (u.val().approved) {
      if (u.val().role === "teacher") t++;
      if (u.val().role === "student") st++;
    }
  });
  animateCount(teacherCount, t);
  animateCount(studentCount, st);
});
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
  db.ref("classes/" + id).set({ name, subjects: {}, students: {} })
    .then(() => {
      className.value = "";
      toast("Class added ✅");
    });
}

/***********************
 📘 CLASS PANEL (SUBJECT ASSIGN)
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

function editClassPanel(id) {
  db.ref("classes/" + id).once("value").then(s => {
    classPanel.innerHTML = `
      <h2>Edit Class</h2>
      <input id="editClassName" value="${s.val().name}">
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
    <input id="tName" placeholder="Name">
    <input id="tEmail" placeholder="Email">
    <input id="tPass" type="password" placeholder="Password">
    <button onclick="createTeacher()">Create</button>
  `;
  openPanel("teacherProfile");
}

function createTeacher() {
  if (tPass.value.length < 6) return toast("Password too short");

  auth.createUserWithEmailAndPassword(tEmail.value, tPass.value)
    .then(res => db.ref("users/" + res.user.uid).set({
      name: tName.value,
      email: tEmail.value,
      role: "teacher",
      approved: true
    }))
    .then(() => {
      toast("Teacher created ✅");
      closePanel("teacherProfile");
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
  const v = Number(minAttendance.value);
  if (v < 0 || v > 100) return toast("Invalid value");
  db.ref("settings").update({ minAttendance: v })
    .then(() => toast("Settings saved"));
}

/***********************
 🧭 UI HELPERS
************************/
function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("active");
}
function nav(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(".sidebar").classList.remove("active");
}

/***********************
 📦 PANELS
************************/
function openPanel(id) {
  document.getElementById(id).classList.add("active-panel");
}
function closePanel(id) {
  document.getElementById(id).classList.remove("active-panel");
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
  setTimeout(() => t.remove(), 3200);
}
function animateCount(el, target) {
  let start = 0;
  const duration = 800;
  const step = Math.max(1, Math.floor(target / 40));

  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.innerText = target;
      clearInterval(timer);
    } else {
      el.innerText = start;
    }
  }, duration / (target / step));
}
