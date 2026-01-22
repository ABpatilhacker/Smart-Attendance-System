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
 📊 DASHBOARD COUNTS
************************/
function loadDashboard() {
  db.ref("classes").on("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });

  db.ref("users").on("value", snap => {
    let teachers = 0, students = 0;
    snap.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") teachers++;
        if (u.val().role === "student") students++;
      }
    });
    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });
}

/***********************
 🟡 APPROVALS
************************/
function loadApprovals() {
  const list = document.getElementById("pendingList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    let hasPending = false;

    snap.forEach(child => {
      const u = child.val();
      const uid = child.key;

      if (u.approved === false) {
        hasPending = true;
        const li = document.createElement("li");
        li.className = "approval-card";

        li.innerHTML = `
          <strong>${u.name}</strong><br>
          <small>${u.email}</small><br>
          <span class="badge">${u.role.toUpperCase()}</span><br><br>
          <button class="approve-btn" onclick="approveUser('${uid}')">Approve</button>
          <button class="reject-btn" onclick="rejectUser('${uid}')">Reject</button>
        `;
        list.appendChild(li);
      }
    });

    if (!hasPending) list.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true })
    .then(() => toast("User approved ✅"));
}

function rejectUser(uid) {
  if (!confirm("Reject this user?")) return;
  db.ref("users/" + uid).remove()
    .then(() => toast("User rejected ❌"));
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  const list = document.getElementById("classList");
  const select = document.getElementById("studentClass");
  if (select) select.innerHTML = "";

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      const li = document.createElement("li");
      li.className = "class-card";
      li.innerHTML = `
        <strong>${c.val().name}</strong>
        <div class="actions">
          <button onclick="openClassDetails('${c.key}')">View</button>
          <button onclick="editClass('${c.key}','${c.val().name}')">✏️</button>
          <button onclick="deleteClass('${c.key}')">🗑️</button>
        </div>
      `;
      list.appendChild(li);

      if (select) {
        const opt = document.createElement("option");
        opt.value = c.key;
        opt.textContent = c.val().name;
        select.appendChild(opt);
      }
    });
  });
}

function addClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return toast("Enter class name");

  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({ name, subjects: {}, students: {} })
    .then(() => {
      document.getElementById("className").value = "";
      toast("Class added ✅");
    });
}

/***********************
 👨‍🏫 TEACHERS
************************/
function loadTeachers() {
  const list = document.getElementById("teacherList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        const li = document.createElement("li");
        li.className = "teacher-card";
        li.innerHTML = `
          <span>${d.email}</span>
          <div class="actions">
            <button onclick="openTeacherProfile('${u.key}')">View</button>
            <button onclick="editTeacher('${u.key}','${d.name}','${d.email}')">✏️</button>
            <button onclick="deleteTeacher('${u.key}')">🗑️</button>
          </div>
        `;
        list.appendChild(li);
      }
    });
  });
}

function addTeacher() {
  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  if (!name || !email) return toast("Fill all fields");

  const uid = db.ref("users").push().key;
  db.ref("users/" + uid).set({
    name, email, role: "teacher", approved: true
  }).then(() => toast("Teacher added ✅"));
}

/***********************
 🎓 STUDENTS
************************/
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("studentRoll").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const classId = document.getElementById("studentClass").value;

  if (!name || !roll || !email || !classId) return toast("Fill all fields");

  const uid = db.ref("users").push().key;
  db.ref("users/" + uid).set({
    name, roll: Number(roll), email, role: "student", classId, approved: true
  }).then(() => toast("Student added ✅"));
}

/***********************
 ⚙️ SETTINGS
************************/
function loadSettings() {
  db.ref("settings/minAttendance").once("value", snap => {
    if (snap.exists()) document.getElementById("minAttendance").value = snap.val();
  });
}

function saveSettings() {
  const val = document.getElementById("minAttendance").value;
  if (!val) return toast("Enter value");
  db.ref("settings").update({ minAttendance: Number(val) })
    .then(() => toast("Settings saved ✅"));
}

/***********************
 ✏️ EDIT & DELETE
************************/
function editClass(id, oldName) {
  const name = prompt("Edit class name:", oldName);
  if (!name) return;
  db.ref("classes/" + id).update({ name })
    .then(() => toast("Class updated"));
}

function deleteClass(id) {
  if (!confirm("Delete class?")) return;
  db.ref("classes/" + id).remove()
    .then(() => toast("Class deleted"));
}

function editTeacher(uid, oldName, oldEmail) {
  const name = prompt("Edit name:", oldName);
  const email = prompt("Edit email:", oldEmail);
  if (!name || !email) return;
  db.ref("users/" + uid).update({ name, email })
    .then(() => toast("Teacher updated"));
}

function deleteTeacher(uid) {
  if (!confirm("Delete teacher?")) return;
  db.ref("users/" + uid).remove()
    .then(() => toast("Teacher deleted"));
}

function editStudent(uid, oldName, oldRoll, oldEmail) {
  const name = prompt("Edit name:", oldName);
  const roll = prompt("Edit roll:", oldRoll);
  const email = prompt("Edit email:", oldEmail);
  if (!name || !roll || !email) return;
  db.ref("users/" + uid).update({ name, roll: Number(roll), email })
    .then(() => toast("Student updated"));
}

function deleteStudent(uid) {
  if (!confirm("Delete student?")) return;
  db.ref("users/" + uid).remove()
    .then(() => toast("Student deleted"));
}

/***********************
 🌟 TOAST
************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 100);
  setTimeout(() => t.remove(), 3500);
           }
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ===== PANEL HELPERS ===== */
function openPanel(id) {
  document.getElementById(id).classList.add("active-panel");
  document.body.classList.add("panel-open");
}

function closePanel(id) {
  document.getElementById(id).classList.remove("active-panel");
  document.body.classList.remove("panel-open");
}

/* ===== CONFIRM MODAL ===== */
function confirmModal(title, text, onConfirm) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalText").innerText = text;
  document.getElementById("modal").classList.add("show");

  document.getElementById("modalOk").onclick = () => {
    closeModal();
    onConfirm();
  };
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}

/* ===== OVERRIDES (SAFE) ===== */
function deleteClass(id) {
  confirmModal("Delete Class", "Are you sure?", () => {
    db.ref("classes/" + id).remove().then(() => toast("Class deleted"));
  });
}

function deleteTeacher(uid) {
  confirmModal("Delete Teacher", "Are you sure?", () => {
    db.ref("users/" + uid).remove().then(() => toast("Teacher deleted"));
  });
}

function rejectUser(uid) {
  confirmModal("Reject User", "Reject this user?", () => {
    db.ref("users/" + uid).remove().then(() => toast("User rejected"));
  });
}

/* ===== PANEL OPEN FIX ===== */
function openTeacherProfile(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const t = snap.val();
    const panel = document.getElementById("teacherProfile");
    panel.innerHTML = `
      <h3>${t.name}</h3>
      <p>${t.email}</p>
      <button onclick="closePanel('teacherProfile')">Close</button>
    `;
    openPanel("teacherProfile");
  });
}
