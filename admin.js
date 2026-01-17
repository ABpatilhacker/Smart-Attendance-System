// ==========================
// FIREBASE INITIALIZATION
// ==========================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ==========================
// AUTH CHECK (ADMIN ONLY)
// ==========================
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access Denied! Only Admins allowed.");
      auth.signOut().then(() => location.href = "login.html");
    } else {
      loadDashboard();
      loadClasses();
      loadTeachers();
      loadStudents();
      loadSettings();
    }
  });
});

// ==========================
// DASHBOARD
// ==========================
function loadDashboard() {
  let teacherCount = 0;
  let studentCount = 0;

  db.ref("users").once("value", snap => {
    snap.forEach(u => {
      if (u.val().role === "teacher") teacherCount++;
      if (u.val().role === "student") studentCount++;
    });

    document.getElementById("teacherCount").innerText = teacherCount;
    document.getElementById("studentCount").innerText = studentCount;
  });

  db.ref("classes").once("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

// ==========================
// CLASSES
// ==========================
function addClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return alert("Enter class name!");

  db.ref("classes").push({ name }).then(() => {
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
      classList.innerHTML += `<li>${c.val().name}</li>`;
      classSelect.innerHTML += `<option value="${c.key}">${c.val().name}</option>`;
    });
  });
}

// ==========================
// TEACHERS
// ==========================
function addTeacher() {
  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  if (!name || !email) return alert("Fill all fields!");

  const id = db.ref("users").push().key;

  db.ref("users/" + id).set({
    name,
    email,
    role: "teacher",
    assignments: {}
  }).then(() => {
    alert(`Teacher "${name}" added successfully!`);
    document.getElementById("teacherName").value = "";
    document.getElementById("teacherEmail").value = "";
  });
}

function loadTeachers() {
  const list = document.getElementById("teacherList");
  db.ref("users").orderByChild("role").equalTo("teacher").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(t => {
      list.innerHTML += `<li onclick="openTeacher('${t.key}')">👨‍🏫 ${t.val().name}</li>`;
    });
  });
}

function openTeacher(id) {
  db.ref("users/" + id).once("value").then(snap => {
    const t = snap.val();
    const box = document.getElementById("teacherProfile");
    const details = document.getElementById("profileDetails");

    box.classList.remove("hidden");
    details.innerHTML = `
      <strong>Name:</strong> ${t.name}<br>
      <strong>Email:</strong> ${t.email}<br>
      <strong>Subjects:</strong> ${t.assignments ? Object.keys(t.assignments).length : 0}
    `;
  });
}

// ==========================
// STUDENTS
// ==========================
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("studentRoll").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const classId = document.getElementById("studentClass").value;

  if (!name || !roll || !email || !classId) return alert("Fill all student fields!");

  const id = db.ref("users").push().key;

  db.ref("users/" + id).set({
    name,
    email,
    role: "student",
    classId,
    roll
  }).then(() => {
    alert(`Student "${name}" added successfully!`);

    db.ref(`classes/${classId}/students/${id}`).set({
      name,
      roll
    });

    document.getElementById("studentName").value = "";
    document.getElementById("studentRoll").value = "";
    document.getElementById("studentEmail").value = "";
  });
}

function loadStudents() {
  const list = document.getElementById("studentList");
  db.ref("users").orderByChild("role").equalTo("student").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(s => {
      list.innerHTML += `<li>🎓 ${s.val().name} (Roll ${s.val().roll})</li>`;
    });
  });
}

// ==========================
// SETTINGS
// ==========================
function loadSettings() {
  db.ref("settings/minAttendance").once("value", snap => {
    document.getElementById("minAttendance").value = snap.val() || 75;
  });
}

function saveSettings() {
  const val = Number(document.getElementById("minAttendance").value);
  if (!val) return alert("Enter valid percentage!");

  db.ref("settings/minAttendance").set(val).then(() => {
    alert(`Minimum attendance updated to ${val}%`);
  });
}

// ==========================
// LOGOUT
// ==========================
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}
