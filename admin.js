/* ==========================
   FIREBASE INITIALIZATION
========================== */
const auth = firebase.auth();
const db = firebase.database();

/* ==========================
   AUTH CHECK (ADMIN ONLY)
========================== */
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  db.ref("users/" + user.uid).once("value")
    .then(snap => {
      const data = snap.val();
      if (!data) {
        alert("User not found in database");
        auth.signOut();
        window.location.href = "login.html";
        return;
      }

      if (data.role !== "admin" || !data.approved) {
        alert("Access Denied. Admin not approved yet!");
        auth.signOut();
        window.location.href = "login.html";
        return;
      }

      // ✅ Admin approved, load dashboard
      loadDashboard();
      loadClasses();
      loadTeachers();
      loadStudents();
      loadSettings();
    })
    .catch(err => {
      console.error("Database error:", err);
      auth.signOut();
      window.location.href = "login.html";
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
      const val = u.val();
      if (val.role === "teacher" && val.approved) teacherCount++;
      if (val.role === "student" && val.approved) studentCount++;
    });

    document.getElementById("teacherCount").innerText = teacherCount;
    document.getElementById("studentCount").innerText = studentCount;
  });

  db.ref("classes").once("value").then(snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

/* ==========================
   CLASSES
========================== */
function addClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return alert("Enter class name");

  db.ref("classes").push({ name, subjects: {}, students: {} }).then(() => {
    alert(`Class "${name}" added successfully!`);
    document.getElementById("className").value = "";
  });
}

function loadClasses() {
  const classList = document.getElementById("classList");
  const classSelect = document.getElementById("studentClass");

  db.ref("classes").on("value", snap => {
    classList.innerHTML = "";
    classSelect.innerHTML = "<option value=''>Select Class</option>";

    snap.forEach(c => {
      const classData = c.val();
      classList.innerHTML += `<li>${classData.name}</li>`;
      classSelect.innerHTML += `<option value="${c.key}">${classData.name}</option>`;
    });
  });
}

/* ==========================
   TEACHERS
========================== */
function addTeacher() {
  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  if (!name || !email) return alert("Fill all teacher fields");

  const id = db.ref("users").push().key;

  db.ref("users/" + id).set({
    name,
    email,
    role: "teacher",
    approved: true,
    assignments: {}
  }).then(() => {
    alert(`Teacher "${name}" added successfully!`);
    document.getElementById("teacherName").value = "";
    document.getElementById("teacherEmail").value = "";
  });
}

function loadTeachers() {
  const list = document.getElementById("teacherList");
  db.ref("users").once("value").then(snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const val = u.val();
      if (val.role === "teacher" && val.approved) {
        list.innerHTML += `<li onclick="openTeacher('${u.key}')">👨‍🏫 ${val.name}</li>`;
      }
    });
  });
}

function openTeacher(id) {
  db.ref("users/" + id).once("value").then(snap => {
    const t = snap.val();
    if (!t) return;

    const box = document.getElementById("teacherProfile");
    const details = document.getElementById("profileDetails");

    box.classList.remove("hidden");
    details.innerHTML = `
      <strong>Name:</strong> ${t.name}<br>
      <strong>Email:</strong> ${t.email}<br>
      <strong>Subjects Assigned:</strong> ${t.assignments ? Object.keys(t.assignments).length : 0}
    `;
  });
}

/* ==========================
   STUDENTS
========================== */
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("studentRoll").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const classId = document.getElementById("studentClass").value;
  if (!name || !roll || !email || !classId) return alert("Fill all student fields");

  const id = db.ref("users").push().key;

  db.ref("users/" + id).set({
    name,
    roll,
    email,
    role: "student",
    classId,
    approved: true
  }).then(() => {
    alert(`Student "${name}" added successfully!`);

    // Add student to class
    db.ref(`classes/${classId}/students/${id}`).set({ name, roll });

    document.getElementById("studentName").value = "";
    document.getElementById("studentRoll").value = "";
    document.getElementById("studentEmail").value = "";
  });
}

function loadStudents() {
  const list = document.getElementById("studentList");
  db.ref("users").once("value").then(snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const val = u.val();
      if (val.role === "student" && val.approved) {
        list.innerHTML += `<li>🎓 ${val.name} (Roll ${val.roll})</li>`;
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
  const val = Number(document.getElementById("minAttendance").value);
  if (!val || val < 0 || val > 100) return alert("Enter valid percentage");

  db.ref("settings/minAttendance").set(val).then(() => alert("Settings saved!"));
}

/* ==========================
   LOGOUT
========================== */
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}
