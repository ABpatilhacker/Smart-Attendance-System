/********************************
 🔥 FIREBASE INIT
*********************************/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/********************************
 🧩 SAFE SELECTOR
*********************************/
const $ = id => document.getElementById(id);

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
 📂 SIDEBAR + NAV
*********************************/
function toggleSidebar() {
  $("sidebar")?.classList.toggle("open");
  $("overlay")?.classList.toggle("show");
}

function nav(id, btn) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(id)?.classList.add("active");

  document.querySelectorAll(".sidebar button")
    .forEach(b => b.classList.remove("active"));
  btn?.classList.add("active");

  $("sidebar")?.classList.remove("open");
  $("overlay")?.classList.remove("show");
}

/********************************
 📊 DASHBOARD
*********************************/
function loadDashboard() {
  db.ref("classes").on("value", s =>
    animateCount($("classCount"), s.numChildren())
  );

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
            <button onclick="openClassView('${c.key}')">View</button>
            <button onclick="openClassEdit('${c.key}')">✏️</button>
            <button class="danger" onclick="deleteClass('${c.key}')">🗑️</button>
          </div>
        </li>`;
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
    db.ref("classes/" + id).remove()
      .then(() => toast("Class deleted ❌"));
  });
}

/********************************
 📘 CLASS VIEW (READ ONLY)
*********************************/
function openClassView(classId) {
  Promise.all([
    db.ref("classes/" + classId).once("value"),
    db.ref("users").once("value")
  ]).then(([cSnap, uSnap]) => {

    const cls = cSnap.val();
    if (!cls) return;

    let subjects = "";
    Object.values(cls.subjects || {}).forEach(s => {
      const teacher = Object.values(uSnap.val() || {})
        .find(u => u.role === "teacher" && u.approved && u.uid === s.teacherId);
      subjects += `
        <div class="subject-card">
          📘 ${s.name}
          <span class="muted">${teacher?.name || "Unassigned"}</span>
        </div>`;
    });

    $("classPanel").innerHTML = `
      <h2>${cls.name}</h2>
      ${subjects || "<p class='muted'>No subjects</p>"}
      <button class="ghost" onclick="closePanel('classPanel')">Close</button>
    `;
    openPanel("classPanel");
  });
}

/********************************
 ✏️ CLASS EDIT
*********************************/
function openClassEdit(classId) {
  db.ref("classes/" + classId).once("value", snap => {
    const cls = snap.val();
    if (!cls) return;

    db.ref("users").once("value", userSnap => {
      const users = userSnap.val() || {};

      // Get teachers only
      let teacherOptions = `<option value="">Unassigned</option>`;
      Object.entries(users).forEach(([uid, u]) => {
        if (u.role === "teacher") {
          teacherOptions += `<option value="${uid}">${u.name}</option>`;
        }
      });

      let subjectHTML = "";
      let subjectCount = 0;

      if (cls.subjects) {
        Object.entries(cls.subjects).forEach(([subId, sub]) => {
          subjectCount++;

          subjectHTML += `
            <div class="subject-card">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${sub.name}</strong>
                <button class="danger" onclick="deleteSubject('${classId}','${subId}')">🗑</button>
              </div>
<select onchange="assignTeacher('${classId}','${subId}', this.value)" class="teacher-dropdown">
  ${Object.entries(users)
    .filter(([uid, u]) => u.role === "teacher" && u.approved)
    .map(([uid, u]) => `
      <option value="${uid}" ${sub.teacherId === uid ? "selected" : ""}>
        ${u.name}
      </option>
    `).join("")}
  <option value="" ${!sub.teacherId ? "selected" : ""}>Unassigned</option>
</select>
              
            </div>
          `;
        });
      }

      $("classPanel").innerHTML = `
        <h2>Edit ${cls.name}</h2>

        <label>Class Name</label>
        <input id="editClassName" value="${cls.name}">

        <h3 style="margin:15px 0 8px;">
          Subjects 
          <span style="background:#6366f1;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;">
            ${subjectCount}
          </span>
        </h3>

        ${subjectHTML || "<p class='muted'>No subjects yet</p>"}

        <div class="subject-add-box">
          <input id="newSubjectName" placeholder="New Subject Name">
          <button onclick="addSubject('${classId}')">+ Add Subject</button>
        </div>

        <button onclick="saveClassEdit('${classId}')">Save Changes</button>
        <button class="ghost" onclick="closePanel('classPanel')">Cancel</button>
      `;

      openPanel("classPanel");
    
    });
  });
}
function deleteSubject(classId, subId) {
  if (!confirm("Delete this subject?")) return;

  db.ref("classes/" + classId + "/subjects/" + subId)
    .remove()
    .then(() => {
      toast("Subject deleted 🗑");
      openClassEdit(classId);
    });
}
function addSubject(classId) {
  const name = $("newSubjectName").value.trim();
  if (!name) return toast("Enter subject name");

  const subId = name.toLowerCase().replace(/\s+/g, "");

  db.ref("classes/" + classId + "/subjects/" + subId).set({
    name: name,
    teacherId: ""
  }).then(() => {
    toast("Subject added 📘");
    openClassEdit(classId);
  });
}

function assignTeacher(classId, subId, teacherId) {
  db.ref("classes/" + classId + "/subjects/" + subId + "/teacherId")
    .set(teacherId)
    .then(() => {
      toast("Teacher updated 🎯");
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
          </li>`;
      }
    });
  });
}

function openTeacherPanel(uid) {
  Promise.all([
    db.ref("users/" + uid).once("value"),
    db.ref("classes").once("value")
  ]).then(([uSnap, cSnap]) => {

    const t = uSnap.val();
    let assigned = [];

    cSnap.forEach(cls => {
      Object.values(cls.val().subjects || {}).forEach(s => {
        if (s.teacherId === uid)
          assigned.push(`${cls.val().name} – ${s.name}`);
      });
    });

    $("teacherPanel").innerHTML = `
      <h2>${t.name}</h2>
      <p class="muted">${t.email}</p>
      <h3>Assigned Subjects</h3>
      ${assigned.length ? `<ul>${assigned.map(a => `<li>${a}</li>`).join("")}</ul>` : "<p class='muted'>None</p>"}
      <button class="ghost" onclick="closePanel('teacherPanel')">Close</button>
    `;
    openPanel("teacherPanel");
  });
}
function createTeacher() {
  const name = $("newTeacherName").value.trim();
  const email = $("newTeacherEmail").value.trim();
  const pass = $("newTeacherPass").value.trim();

  if (!name || !email || !pass) return toast("Fill all fields");

  const newRef = db.ref("users").push();
  const uid = newRef.key;

  newRef.set({
    uid: uid,
    name: name,
    email: email,
    password: pass, // for project demo only
    role: "teacher",
    approved: true
  }).then(() => {
   $("newTeacherName").value = "";
$("newTeacherEmail").value = "";
$("newTeacherPass").value = "";
    toast("Teacher added successfully 👨‍🏫");
    closePanel("addTeacherPanel");
  });
}
function openAddTeacher() {

  $("addTeacherPanel").innerHTML = `
    <h2>Add New Teacher</h2>

    <label>Name</label>
    <input id="newTeacherName" placeholder="Enter teacher name">

    <label>Email</label>
    <input id="newTeacherEmail" type="email" placeholder="Enter email">

    <label>Password</label>
    <input id="newTeacherPass" type="password" placeholder="Enter password">

    <button onclick="createTeacher()">Create Teacher</button>
    <button class="ghost" onclick="closePanel('addTeacherPanel')">Cancel</button>
  `;

  openPanel("addTeacherPanel");
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
          </li>`;
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
 📦 PANELS + OVERLAY
*********************************/
function openPanel(id) {
  $(id)?.classList.add("active-panel");
  $("overlay")?.classList.add("show");
}

function closePanel(id) {
  $(id)?.classList.remove("active-panel");
  $("overlay")?.classList.remove("show");
}

/********************************
 ❓ MODAL
*********************************/
function confirmModal(title, text, cb) {
  $("modalTitle").innerText = title;
  $("modalText").innerText = text;
  $("modal").classList.add("show");
  $("modalOk").onclick = () => {
    $("modal").classList.remove("show");
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

/********************************
 🌙 THEME TOGGLE
*********************************/
function toggleTheme() {
  document.body.classList.toggle("dark");

  const btn = document.querySelector(".theme-btn");

  if (document.body.classList.contains("dark")) {
    btn.innerText = "☀";
    localStorage.setItem("adminTheme", "dark");
  } else {
    btn.innerText = "🌙";
    localStorage.setItem("adminTheme", "light");
  }
}

window.addEventListener("load", () => {
  const saved = localStorage.getItem("adminTheme");
  const btn = document.querySelector(".theme-btn");

  if (saved === "dark") {
    document.body.classList.add("dark");
    if (btn) btn.innerText = "☀";
  }
});
