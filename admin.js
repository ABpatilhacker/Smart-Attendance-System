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
    loadTeachers();
    loadClasses();
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
  db.ref("users").on("value", snap => {
    let teachers = 0, students = 0;

    snap.forEach(u => {
      if (!u.val().approved) return;
      if (u.val().role === "teacher") teachers++;
      if (u.val().role === "student") students++;
    });

    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });

  db.ref("classes").on("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
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
        list.innerHTML += `
          <li>
            <b>${d.name}</b>
            <small>${d.email}</small>
          </li>
        `;
      }
    });
  });
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  const list = document.getElementById("classList");
  if (!list) return;

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";

    snap.forEach(c => {
      list.innerHTML += `
        <li>
          <b>${c.val().name}</b>
          <small>
            Students: ${c.child("students").numChildren()} |
            Subjects: ${c.child("subjects").numChildren()}
          </small>
        </li>
      `;
    });
  });
}

/***********************
 ⚙️ SETTINGS
************************/
function loadSettings() {
  const input = document.getElementById("minAttendance");
  if (!input) return;

  db.ref("settings/minAttendance").once("value")
    .then(s => input.value = s.val() || 75);
}

function saveSettings() {
  const val = Number(document.getElementById("minAttendance").value);
  if (val < 0 || val > 100) return alert("Invalid value");

  db.ref("settings").update({ minAttendance: val })
    .then(() => alert("Settings saved"));
}

/***********************
 🧭 SIDEBAR (FIXED)
************************/
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

document.addEventListener("click", e => {
  if (!document.body.classList.contains("sidebar-open")) return;
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    closeSidebar();
  }
});

/***********************
 🧭 NAV
************************/
function nav(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
     }
