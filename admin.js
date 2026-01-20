// ==========================
// FIREBASE INIT (same config)
// ==========================
const auth = firebase.auth();
const db = firebase.database();

// ==========================
// AUTH CHECK
// ==========================
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied!");
      auth.signOut();
      window.location.href = "login.html";
      return;
    }

    loadDashboardData();
  });
});

// ==========================
// LOAD ALL DASHBOARD DATA
// ==========================
function loadDashboardData() {
  loadTeachers();
  loadStudents();
  loadClasses();
}

// ==========================
// LOAD TEACHERS
// ==========================
function loadTeachers() {
  const list = document.getElementById("teacherList");
  if (!list) return;

  list.innerHTML = "";

  db.ref("users").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const u = child.val();
      if (u.role === "teacher") {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${u.name}</strong><br>
          <small>${u.email}</small>
        `;
        list.appendChild(li);
      }
    });
  });
}

// ==========================
// LOAD STUDENTS
// ==========================
function loadStudents() {
  const list = document.getElementById("studentList");
  if (!list) return;

  list.innerHTML = "";

  db.ref("users").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const u = child.val();
      if (u.role === "student") {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${u.name}</strong>
          <small> (${u.classId || "N/A"})</small>
        `;
        list.appendChild(li);
      }
    });
  });
}

// ==========================
// LOAD CLASSES
// ==========================
function loadClasses() {
  const list = document.getElementById("classList");
  if (!list) return;

  list.innerHTML = "";

  db.ref("classes").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const c = child.val();
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${c.name}</strong><br>
        <small>${Object.keys(c.subjects || {}).length} subjects</small>
      `;
      list.appendChild(li);
    });
  });
}

// ==========================
// ADD TEACHER
// ==========================
function addTeacher() {
  const name = document.getElementById("tName").value.trim();
  const email = document.getElementById("tEmail").value.trim();
  const password = document.getElementById("tPassword").value.trim();
  const dept = document.getElementById("tDept").value.trim();

  if (!name || !email || !password || !dept) {
    alert("Fill all teacher fields");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;
      return db.ref("users/" + uid).set({
        name,
        email,
        role: "teacher",
        department: dept,
        approved: true
      });
    })
    .then(() => {
      alert("Teacher added successfully");
      loadTeachers();
    })
    .catch(err => alert(err.message));
}

// ==========================
// ADD CLASS
// ==========================
function addClass() {
  const id = document.getElementById("classId").value.trim();
  const name = document.getElementById("className").value.trim();

  if (!id || !name) {
    alert("Enter class id & name");
    return;
  }

  db.ref("classes/" + id).set({
    name: name,
    subjects: {}
  })
  .then(() => {
    alert("Class added");
    loadClasses();
  })
  .catch(err => alert(err.message));
}

// ==========================
// LOGOUT
// ==========================
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}
