// ==============================
// Global Firebase refs
// ==============================
const auth = firebase.auth();
const db = firebase.database();

const sidebar = document.getElementById("sidebar");
const mainSections = document.querySelectorAll(".section");
const pageTitle = document.getElementById("pageTitle");
const adminName = document.getElementById("adminName");

// ==============================
// Sidebar toggle & section switch
// ==============================
function toggleSidebar() {
  sidebar.classList.toggle("open");
}

function showSection(id) {
  mainSections.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  pageTitle.innerText = id.charAt(0).toUpperCase() + id.slice(1);
  // Close sidebar on mobile
  sidebar.classList.remove("open");
}

// ==============================
// Logout
// ==============================
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

// ==============================
// Auth & Admin load
// ==============================
auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
    } else {
      adminName.innerText = snap.val().name;
      loadDashboard();
      loadClasses();
      loadTeachers();
      loadStudents();
      loadSettings();
    }
  });
});

// ==============================
// Dashboard KPIs
// ==============================
function loadDashboard() {
  db.ref("users").once("value").then(snap => {
    let teacherCount = 0, studentCount = 0;
    snap.forEach(u => {
      if (u.val().role === "teacher") teacherCount++;
      if (u.val().role === "student") studentCount++;
    });
    document.getElementById("teacherCount").innerText = teacherCount;
    document.getElementById("studentCount").innerText = studentCount;
  });

  db.ref("classes").once("value").then(snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

// ==============================
// Classes: Add/Edit/Delete
// ==============================
function createClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return alert("Enter class name");

  const newRef = db.ref("classes").push();
  newRef.set({ name, students: {}, subjects: {} })
    .then(() => loadClasses());
}

function loadClasses() {
  const list = document.getElementById("classList");
  list.innerHTML = "";
  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      const val = c.val();
      const li = document.createElement("li");
      li.innerHTML = `
        ${val.name} 
        <button onclick="editClass('${c.key}')">✏️</button>
        <button onclick="deleteClass('${c.key}')">🗑️</button>
      `;
      list.appendChild(li);
    });
  });
}

function editClass(id) {
  db.ref("classes/" + id).once("value").then(snap => {
    const cls = snap.val();
    const name = prompt("Edit Class Name:", cls.name);
    if (!name) return;
    db.ref("classes/" + id + "/name").set(name).then(loadClasses);
  });
}

function deleteClass(id) {
  if (!confirm("Delete this class?")) return;
  db.ref("classes/" + id).remove().then(loadClasses);
}

// ==============================
// Teachers: List & Profile + Assign Classes
// ==============================
function loadTeachers() {
  const list = document.getElementById("teacherList");
  list.innerHTML = "";
  db.ref("users").orderByChild("role").equalTo("teacher")
    .on("value", snap => {
      list.innerHTML = "";
      snap.forEach(t => {
        const li = document.createElement("li");
        li.innerText = t.val().name;
        li.onclick = () => openTeacher(t.key);
        list.appendChild(li);
      });
    });
}

function openTeacher(id) {
  db.ref("users/" + id).once("value").then(snap => {
    const t = snap.val();
    const profile = document.getElementById("teacherProfile");
    profile.classList.remove("hidden");

    // List assigned classes
    let assignments = "";
    if (t.assignments) {
      assignments = "<ul>" + Object.keys(t.assignments).map(k => `<li>${k.replace("_", " - ")}</li>`).join("") + "</ul>";
    } else assignments = "<p>No assignments yet.</p>";

    profile.innerHTML = `
      <h3>${t.name}</h3>
      <p>Email: ${t.email}</p>
      <h4>Assignments:</h4>${assignments}
      <h4>Assign Class & Subject:</h4>
      <select id="assignClass"></select>
      <input type="text" id="assignSubject" placeholder="Subject Name">
      <button onclick="assignClassSubject('${id}')">Assign</button>
    `;

    // Load all classes in dropdown
    const select = document.getElementById("assignClass");
    db.ref("classes").once("value").then(snap => {
      select.innerHTML = "";
      snap.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.key;
        opt.textContent = c.val().name;
        select.appendChild(opt);
      });
    });
  });
}

function assignClassSubject(teacherId) {
  const clsId = document.getElementById("assignClass").value;
  const subject = document.getElementById("assignSubject").value.trim();
  if (!clsId || !subject) return alert("Fill both fields");

  // Add to class subjects
  db.ref(`classes/${clsId}/subjects`).push(subject);

  // Add to teacher assignments
  db.ref(`users/${teacherId}/assignments/${clsId + "_" + subject}`).set(true);

  alert("Assigned!");
  openTeacher(teacherId);
}

// ==============================
// Students: Add & List
// ==============================
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNo").value.trim();
  const cls = document.getElementById("studentClass").value;
  if (!name || !roll || !cls) return alert("Fill all fields");

  db.ref("students").push({ name, roll, classId: cls })
    .then(() => loadStudents());
}

function loadStudents() {
  const list = document.getElementById("studentList");
  db.ref("students").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(s => {
      const li = document.createElement("li");
      li.innerText = `${s.val().name} (Roll ${s.val().roll})`;
      list.appendChild(li);
    });
  });

  // Load classes in dropdown
  const select = document.getElementById("studentClass");
  db.ref("classes").once("value").then(snap => {
    select.innerHTML = "";
    snap.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.key;
      opt.textContent = c.val().name;
      select.appendChild(opt);
    });
  });
}

// ==============================
// Settings
// ==============================
function loadSettings() {
  db.ref("settings/minAttendance").once("value", snap => {
    document.getElementById("minAttendance").value = snap.val() || 75;
  });
}

function saveSettings() {
  const v = document.getElementById("minAttendance").value;
  db.ref("settings/minAttendance").set(Number(v));
  alert("Saved!");
    }
