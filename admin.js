/* ==========================
   FIREBASE
========================== */
const auth = firebase.auth();
const db = firebase.database();

/* ==========================
   AUTH CHECK (ADMIN ONLY)
========================== */
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin" || !snap.val().approved) {
      alert("Access denied");
      auth.signOut();
      location.href = "login.html";
      return;
    }

    loadDashboard();
    loadClasses();
    loadTeachers();
    loadStudents();
    loadSettings();
  });
});

/* ==========================
   DASHBOARD COUNTS
========================== */
function loadDashboard() {
  let teachers = 0;
  let students = 0;

  db.ref("users").once("value").then(snap => {
    snap.forEach(u => {
      const v = u.val();
      if (v.role === "teacher") teachers++;
      if (v.role === "student") students++;
    });

    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });

  db.ref("classes").once("value").then(snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

/* ==========================
   CLASSES (READ ONLY)
========================== */
function loadClasses() {
  const list = document.getElementById("classList");
  const select = document.getElementById("studentClass");

  db.ref("classes").once("value").then(snap => {
    list.innerHTML = "";
    select.innerHTML = `<option value="">Select Class</option>`;

    snap.forEach(c => {
      list.innerHTML += `<li>🏫 ${c.val().name}</li>`;
      select.innerHTML += `<option value="${c.key}">${c.val().name}</option>`;
    });
  });
}

/* ==========================
   TEACHERS
========================== */
function loadTeachers() {
  const list = document.getElementById("teacherList");

  db.ref("users").once("value").then(snap => {
    list.innerHTML = "";

    snap.forEach(u => {
      const t = u.val();
      if (t.role === "teacher") {
        list.innerHTML += `<li>👨‍🏫 ${t.name}</li>`;
      }
    });
  });
}

/* ==========================
   STUDENTS
========================== */
function loadStudents() {
  const list = document.getElementById("studentList");

  db.ref("users").once("value").then(snap => {
    list.innerHTML = "";

    snap.forEach(u => {
      const s = u.val();
      if (s.role === "student") {
        list.innerHTML += `<li>🎓 ${s.name} (Roll ${s.roll})</li>`;
      }
    });
  });
}

/* ==========================
   SETTINGS
========================== */
function loadSettings() {
  db.ref("settings/minAttendance").once("value").then(snap => {
    document.getElementById("minAttendance").value = snap.val() || 75;
  });
}

function saveSettings() {
  const v = Number(document.getElementById("minAttendance").value);
  if (!v || v < 1 || v > 100) return alert("Invalid percentage");

  db.ref("settings/minAttendance").set(v);
  alert("Settings saved");
}

/* ==========================
   LOGOUT
========================== */
function logout() {
  auth.signOut().then(() => location.href = "login.html");
                 }
