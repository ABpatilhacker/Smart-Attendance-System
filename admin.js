/***********************
 🔥 FIREBASE CONFIG
************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

/***********************
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "login.html";
  else {
    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  }
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

/***********************
 📊 DASHBOARD COUNTS
************************/
function loadDashboard() {
  db.ref("classes").on("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });

  db.ref("users").on("value", snap => {
    let teachers = 0, students = 0;
    snap.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") teachers++;
        if (u.val().role === "student") students++;
      }
    });
    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });
}

/***********************
 🟡 APPROVAL DASHBOARD
************************/
function loadApprovals() {
  const list = document.getElementById("pendingList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    let hasPending = false;

    snap.forEach(child => {
      const u = child.val();
      const uid = child.key;

      if (u.approved === false) {
        hasPending = true;
        const li = document.createElement("li");
        li.className = "approval-card";

        li.innerHTML = `
          <strong>${u.name}</strong><br>
          <small>${u.email}</small><br>
          <span class="badge">${u.role.toUpperCase()}</span><br><br>
          <button class="approve-btn" onclick="approveUser('${uid}')">✅ Approve</button>
          <button class="reject-btn" onclick="rejectUser('${uid}')">❌ Reject</button>
        `;
        list.appendChild(li);
      }
    });

    if (!hasPending) list.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true })
    .then(() => toast("User approved ✅"));
}

function rejectUser(uid) {
  if (!confirm("Are you sure you want to reject this user?")) return;
  db.ref("users/" + uid).remove()
    .then(() => toast("User rejected ❌"));
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  const list = document.getElementById("classList");
  const select = document.getElementById("studentClass");
  if (select) select.innerHTML = "";

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      const li = document.createElement("li");
      li.className = "class-card";
      li.innerHTML = `
        <strong>${c.val().name}</strong>
        <button onclick="openClassDetails('${c.key}')">View Details</button>
      `;
      list.appendChild(li);

      if (select) {
        const opt = document.createElement("option");
        opt.value = c.key;
        opt.textContent = c.val().name;
        select.appendChild(opt);
      }
    });
  });
}

function addClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return toast("Enter class name ⚠️");

  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({ name, subjects: {}, students: {} })
    .then(() => {
      document.getElementById("className").value = "";
      toast("Class added successfully ✅");
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
      const data = u.val();
      if (data.role === "teacher" && data.approved) {
        const li = document.createElement("li");
        li.className = "teacher-card";
        li.innerHTML = `
          <span>${data.email}</span>
          <button onclick="openTeacherProfile('${u.key}')">View Profile</button>
        `;
        list.appendChild(li);
      }
    });
  });
}

function addTeacher() {
  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  if (!name || !email) return toast("Fill all fields ⚠️");

  const uid = db.ref("users").push().key;
  db.ref("users/" + uid).set({
    name, email, role: "teacher", approved: true, assignments: {}
  }).then(() => {
    document.getElementById("teacherName").value = "";
    document.getElementById("teacherEmail").value = "";
    toast("Teacher added ✅");
  });
}

/***********************
 🎓 STUDENTS
************************/
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("studentRoll").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const classId = document.getElementById("studentClass").value;

  if (!name || !roll || !email || !classId) return toast("Fill all fields ⚠️");

  const uid = db.ref("users").push().key;
  db.ref("users/" + uid).set({
    name, roll: Number(roll), email, role: "student", classId, approved: true
  }).then(() => {
    document.getElementById("studentName").value = "";
    document.getElementById("studentRoll").value = "";
    document.getElementById("studentEmail").value = "";
    toast("Student added ✅");
  });
}

/***********************
 ⚙️ SETTINGS
************************/
function loadSettings() {
  db.ref("settings/minAttendance").once("value", snap => {
    if (snap.exists()) document.getElementById("minAttendance").value = snap.val();
  });
}

function saveSettings() {
  const val = document.getElementById("minAttendance").value;
  if (!val) return toast("Enter minimum attendance ⚠️");

  db.ref("settings").update({ minAttendance: Number(val) })
    .then(() => toast("Settings saved ✅"));
}

/***********************
 🌟 DETAILS PANELS
************************/
function openTeacherProfile(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const t = snap.val();
    const panel = document.getElementById("teacherProfile");

    db.ref("classes").once("value").then(csnap => {
      let subjects = [];
      let classesAssigned = [];
      csnap.forEach(c => {
        const classData = c.val();
        if (classData.subjects) {
          for (let sub in classData.subjects) {
            if (classData.subjects[sub].teacherId === uid)
              subjects.push(classData.subjects[sub].name);
          }
        }
        if (classData.subjects) {
          for (let sub in classData.subjects) {
            if (classData.subjects[sub].teacherId === uid)
              classesAssigned.push(classData.name);
          }
        }
      });

      panel.innerHTML = `
        <h3>${t.name} – Teacher Profile</h3>
        <p><strong>Email:</strong> ${t.email}</p>
        <p><strong>Classes:</strong> ${[...new Set(classesAssigned)].join(", ") || "None"}</p>
        <p><strong>Subjects:</strong> ${subjects.join(", ") || "None"}</p>
        <button onclick="closePanel('teacherProfile')">Close</button>
      `;
      panel.classList.add("active-panel");
    });
  });
}

function openClassDetails(classId) {
  db.ref("classes/" + classId).once("value").then(snap => {
    const c = snap.val();
    const panel = document.getElementById("classPanel");

    db.ref("users").once("value").then(usersSnap => {
      // Subjects with teacher names
      let subjectsHTML = "";
      for (let sub in c.subjects) {
        const teacherId = c.subjects[sub].teacherId;
        const teacher = usersSnap.val()[teacherId];
        const teacherName = teacher ? teacher.name : "Unassigned";
        subjectsHTML += `<li>${c.subjects[sub].name} – ${teacherName}</li>`;
      }

      // Students Table
      let studentsHTML = "<tr><th>Roll</th><th>Name</th></tr>";
      for (let uid in c.students || {}) {
        const student = usersSnap.val()[uid];
        if (student) studentsHTML += `<tr onclick="openStudentProfile('${uid}')"><td>${student.roll}</td><td>${student.name}</td></tr>`;
      }

      panel.innerHTML = `
        <h3>${c.name} – Class Details</h3>
        <h4>Subjects</h4>
        <ul>${subjectsHTML || "<li>No subjects assigned</li>"}</ul>
        <h4>Students</h4>
        <table>${studentsHTML}</table>
        <button onclick="closePanel('classPanel')">Close</button>
      `;
      panel.classList.add("active-panel");
    });
  });
}

function openStudentProfile(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const s = snap.val();
    const panel = document.getElementById("studentPanel");
    db.ref("classes/" + s.classId).once("value").then(cSnap => {
      const className = cSnap.exists() ? cSnap.val().name : "Unknown";
      panel.innerHTML = `
        <h3>${s.name} – Student Profile</h3>
        <p><strong>Email:</strong> ${s.email}</p>
        <p><strong>Roll Number:</strong> ${s.roll}</p>
        <p><strong>Class:</strong> ${className}</p>
        <button onclick="closePanel('studentPanel')">Close</button>
      `;
      panel.classList.add("active-panel");
    });
  });
}

function closePanel(id) {
  document.getElementById(id).classList.remove("active-panel");
}

/***********************
 🌟 TOAST MESSAGE
************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 100);
  setTimeout(() => t.classList.remove("show"), 3000);
  setTimeout(() => t.remove(), 3500);
                            }

/***********************
 ✏️ EDIT & DELETE CLASSES
************************/
function editClass(classId, oldName) {
  const newName = prompt("Edit class name:", oldName);
  if (!newName) return;

  db.ref("classes/" + classId).update({ name: newName })
    .then(() => toast("Class updated ✅"));
}

function deleteClass(classId) {
  if (!confirm("Delete this class? This cannot be undone.")) return;

  db.ref("classes/" + classId).remove()
    .then(() => toast("Class deleted ❌"));
}

/***********************
 ✏️ EDIT & DELETE TEACHERS
************************/
function editTeacher(uid, currentName, currentEmail) {
  const name = prompt("Edit teacher name:", currentName);
  if (!name) return;

  const email = prompt("Edit teacher email:", currentEmail);
  if (!email) return;

  db.ref("users/" + uid).update({ name, email })
    .then(() => toast("Teacher updated ✅"));
}

function deleteTeacher(uid) {
  if (!confirm("Delete this teacher?")) return;

  db.ref("users/" + uid).remove()
    .then(() => toast("Teacher deleted ❌"));
}

/***********************
 ✏️ EDIT & DELETE STUDENTS
************************/
function editStudent(uid, data) {
  const name = prompt("Edit student name:", data.name);
  if (!name) return;

  const roll = prompt("Edit roll number:", data.roll);
  if (!roll) return;

  const email = prompt("Edit student email:", data.email);
  if (!email) return;

  db.ref("users/" + uid).update({
    name,
    roll: Number(roll),
    email
  }).then(() => toast("Student updated ✅"));
}

function deleteStudent(uid) {
  if (!confirm("Delete this student?")) return;

  db.ref("users/" + uid).remove()
    .then(() => toast("Student deleted ❌"));
}
