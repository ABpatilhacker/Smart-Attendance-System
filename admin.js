// ================= FIREBASE GLOBALS =================
const auth = firebase.auth();
const db = firebase.database();

// ================= DOM REFS =================
const sidebar = document.getElementById("sidebar");
const sections = document.querySelectorAll(".section");

// ================= SIDEBAR =================
function toggleSidebar() {
  sidebar.classList.toggle("open");
}

document.addEventListener("click", e => {
  if (!sidebar.contains(e.target) && !e.target.classList.contains("menu-btn")) {
    sidebar.classList.remove("open");
  }
});

function showSection(id) {
  sections.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("pageTitle").innerText =
    id.charAt(0).toUpperCase() + id.slice(1);
  sidebar.classList.remove("open");
}

// ================= AUTH =================
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "index.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
      return;
    }

    document.getElementById("adminName").innerText = snap.val().name;
    loadDashboard();
    loadClasses();
    loadTeachers();
    loadStudents();
    loadSettings();
  });
});

// ================= LOGOUT =================
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

// ================= DASHBOARD =================
function loadDashboard() {
  let teachers = 0, students = 0;

  db.ref("users").once("value", snap => {
    snap.forEach(u => {
      if (u.val().role === "teacher") teachers++;
      if (u.val().role === "student") students++;
    });

    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });

  db.ref("classes").once("value", s => {
    document.getElementById("classCount").innerText = s.numChildren();
  });
}

// ================= CLASSES =================
function createClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return alert("Enter class name");

  db.ref("classes").push({ name });
  document.getElementById("className").value = "";
}

function loadClasses() {
  const list = document.getElementById("classList");
  const studentSelect = document.getElementById("studentClass");

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    studentSelect.innerHTML = "";

    snap.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `
        <b>${c.val().name}</b>
        <button onclick="editClass('${c.key}','${c.val().name}')">✏️</button>
        <button onclick="deleteClass('${c.key}')">🗑️</button>
      `;
      list.appendChild(li);

      const opt = document.createElement("option");
      opt.value = c.key;
      opt.textContent = c.val().name;
      studentSelect.appendChild(opt);
    });
  });
}

function editClass(id, oldName) {
  const name = prompt("Edit class name", oldName);
  if (!name) return;
  db.ref("classes/" + id + "/name").set(name);
}

function deleteClass(id) {
  if (!confirm("Delete this class?")) return;
  db.ref("classes/" + id).remove();
}

// ================= TEACHERS =================
function loadTeachers() {
  const list = document.getElementById("teacherList");

  db.ref("users").orderByChild("role").equalTo("teacher")
    .on("value", snap => {
      list.innerHTML = "";
      snap.forEach(t => {
        const li = document.createElement("li");
        li.textContent = t.val().name;
        li.onclick = () => openTeacher(t.key);
        list.appendChild(li);
      });
    });
}

function openTeacher(id) {
  db.ref("users/" + id).once("value", snap => {
    const t = snap.val();
    const box = document.getElementById("teacherProfile");

    box.classList.remove("hidden");
    box.innerHTML = `
      <h3>${t.name}</h3>
      <p>Email: ${t.email}</p>
      <p>Assigned Subjects: ${Object.keys(t.assignments || {}).length}</p>
    `;
  });
}

// ================= STUDENTS =================
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNo").value.trim();
  const classId = document.getElementById("studentClass").value;

  if (!name || !roll || !classId) return alert("Fill all fields");

  const ref = db.ref("students").push({
    name,
    roll,
    classId
  });

  db.ref("classes/" + classId + "/students/" + ref.key).set(true);

  document.getElementById("studentName").value = "";
  document.getElementById("rollNo").value = "";
}

function loadStudents() {
  const list = document.getElementById("studentList");

  db.ref("students").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(s => {
      const li = document.createElement("li");
      li.textContent = `${s.val().name} (Roll ${s.val().roll})`;
      list.appendChild(li);
    });
  });
}

// ================= SETTINGS =================
function loadSettings() {
  db.ref("settings/minAttendance").once("value", s => {
    document.getElementById("minAttendance").value = s.val() || 75;
  });
}

function saveSettings() {
  const v = Number(document.getElementById("minAttendance").value);
  db.ref("settings/minAttendance").set(v);
  alert("Settings saved");
}
