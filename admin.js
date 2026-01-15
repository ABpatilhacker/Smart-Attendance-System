// ================== GLOBAL ==================
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const pageTitle = document.getElementById("pageTitle");

// ================== AUTH ==================
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
      location.href = "index.html";
      return;
    }

    document.getElementById("adminName").innerText = snap.val().name;

    // Default load
    showSection("dashboard");
    loadDashboard();
    loadClasses();
    loadTeachers();
    loadStudents();
    loadSettings();
  });
});

// ================== SIDEBAR ==================
function toggleSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

// Click outside → close
overlay.addEventListener("click", closeSidebar);

// Sidebar navigation
function navigate(sectionId) {
  showSection(sectionId);
  closeSidebar();
}

// ================== SECTION SWITCH ==================
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active")
  );

  const section = document.getElementById(id);
  if (section) section.classList.add("active");

  pageTitle.innerText = id.charAt(0).toUpperCase() + id.slice(1);
}

// ================== LOGOUT ==================
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

// ================== DASHBOARD ==================
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

  db.ref("classes").once("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

// ================== CLASSES ==================
function createClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return alert("Enter class name");

  db.ref("classes").push({ name });
  document.getElementById("className").value = "";
}

function loadClasses() {
  const list = document.getElementById("classList");
  const select = document.getElementById("studentClass");

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    select.innerHTML = "";

    snap.forEach(c => {
      list.innerHTML += `<li>${c.val().name}</li>`;
      select.innerHTML +=
        `<option value="${c.key}">${c.val().name}</option>`;
    });
  });
}

// ================== TEACHERS ==================
function loadTeachers() {
  const list = document.getElementById("teacherList");

  db.ref("users")
    .orderByChild("role")
    .equalTo("teacher")
    .on("value", snap => {
      list.innerHTML = "";
      snap.forEach(t => {
        list.innerHTML +=
          `<li onclick="openTeacher('${t.key}')">${t.val().name}</li>`;
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
      <p><b>Email:</b> ${t.email}</p>
      <p><b>Assignments:</b> ${Object.keys(t.assignments || {}).length}</p>
    `;
  });
}

// ================== STUDENTS ==================
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNo").value.trim();
  const cls = document.getElementById("studentClass").value;

  if (!name || !roll || !cls) return alert("Fill all fields");

  db.ref("students").push({
    name,
    roll,
    classId: cls
  });

  document.getElementById("studentName").value = "";
  document.getElementById("rollNo").value = "";
}

function loadStudents() {
  const list = document.getElementById("studentList");

  db.ref("students").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(s => {
      list.innerHTML +=
        `<li>${s.val().name} (Roll ${s.val().roll})</li>`;
    });
  });
}

// ================== SETTINGS ==================
function loadSettings() {
  db.ref("settings/minAttendance").once("value", s => {
    document.getElementById("minAttendance").value = s.val() || 75;
  });
}

function saveSettings() {
  const val = Number(document.getElementById("minAttendance").value);
  db.ref("settings/minAttendance").set(val);
  alert("Settings saved");
  }
