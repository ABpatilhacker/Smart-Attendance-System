/* ==========================
   FIREBASE INITIALIZATION
========================== */
const auth = firebase.auth();
const db = firebase.database();

/* ==========================
   AUTH CHECK (ADMIN ONLY)
========================== */
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  db.ref("users/" + user.uid).once("value")
    .then(snap => {
      if (!snap.exists()) {
        alert("User record not found");
        auth.signOut();
        window.location.href = "login.html";
        return;
      }

      const data = snap.val();
      if (data.role !== "admin" || !data.approved) {
        alert("Access Denied");
        auth.signOut();
        window.location.href = "login.html";
        return;
      }

      // ✅ LOAD EVERYTHING
      loadDashboard();
      loadClasses();
      loadTeachers();
      loadStudents();
      loadSettings();
    });
});

/* ==========================
   DASHBOARD
========================== */
function loadDashboard() {
  let teacherCount = 0;
  let studentCount = 0;

  db.ref("users").once("value").then(snap => {
    snap.forEach(u => {
      const user = u.val();
      if (user.role === "teacher" && user.approved) teacherCount++;
      if (user.role === "student" && user.approved) studentCount++;
    });

    document.getElementById("teacherCount").innerText = teacherCount;
    document.getElementById("studentCount").innerText = studentCount;
  });

  db.ref("classes").once("value").then(snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

/* ==========================
   CLASSES (FIXED FOR YOUR JSON)
========================== */
function loadClasses() {
  const classList = document.getElementById("classList");
  if (!classList) return;

  db.ref("classes").once("value").then(snap => {
    classList.innerHTML = "";

    const classes = snap.val();
    if (!classes) return;

    Object.keys(classes).forEach(classId => {
      const cls = classes[classId];
      classList.innerHTML += `<li>🏫 ${cls.name}</li>`;
    });
  });
}

/* ==========================
   TEACHERS
========================== */
function loadTeachers() {
  const list = document.getElementById("teacherList");
  if (!list) return;

  list.innerHTML = "";

  db.ref("users").once("value").then(snap => {
    snap.forEach(u => {
      const user = u.val();
      if (user.role === "teacher" && user.approved) {
        list.innerHTML += `<li>👨‍🏫 ${user.name}</li>`;
      }
    });
  });
}

/* ==========================
   STUDENTS
========================== */
function loadStudents() {
  const list = document.getElementById("studentList");
  if (!list) return;

  list.innerHTML = "";

  db.ref("users").once("value").then(snap => {
    snap.forEach(u => {
      const user = u.val();
      if (user.role === "student" && user.approved) {
        list.innerHTML += `<li>🎓 ${user.name} (Roll ${user.roll})</li>`;
      }
    });
  });
}

/* ==========================
   SETTINGS
========================== */
function loadSettings() {
  const input = document.getElementById("minAttendance");
  if (!input) return;

  db.ref("settings/minAttendance").once("value").then(snap => {
    input.value = snap.val() || 75;
  });
}

function saveSettings() {
  const val = Number(document.getElementById("minAttendance").value);
  if (!val || val < 1 || val > 100) {
    alert("Enter valid attendance percentage");
    return;
  }

  db.ref("settings/minAttendance").set(val)
    .then(() => alert("Settings saved successfully"));
}

/* ==========================
   LOGOUT
========================== */
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}
