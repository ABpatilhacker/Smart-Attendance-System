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
    loadStudents();
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
      if (u.val().approved === true) {
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
    .then(() => {
      toast("User approved ✅");
      loadApprovals();
      loadDashboard();
    });
}

function rejectUser(uid) {
  if (!confirm("Are you sure you want to reject this user?")) return;

  db.ref("users/" + uid).remove()
    .then(() => {
      toast("User rejected ❌");
      loadApprovals();
      loadDashboard();
    });
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
  db.ref("classes/" + id).set({ name, students: {}, subjects: {} })
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
      if (data.role === "teacher" && data.approved === true) {
        const li = document.createElement("li");
        li.className = "teacher-card";
        li.innerHTML = `
          <strong>${data.name}</strong> – ${data.email}
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
    loadTeachers();
    loadDashboard();
  });
}

/***********************
 🎓 STUDENTS
************************/
function loadStudents() {
  const list = document.getElementById("studentList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const data = u.val();
      if (data.role === "student" && data.approved === true) {
        const li = document.createElement("li");
        li.className = "student-card";
        li.innerHTML = `
          <strong>${data.name}</strong>
          (Roll ${data.roll}) – ${data.email}
          <button onclick="openStudentProfile('${u.key}')">View Profile</button>
        `;
        list.appendChild(li);
      }
    });
  });
}

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
    loadStudents();
    loadDashboard();
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
    const subjects = [];

    db.ref("classes").once("value").then(csnap => {
      csnap.forEach(c => {
        const classData = c.val();
        for (let sub in classData.subjects || {}) {
          if (classData.subjects[sub].teacherId === uid)
            subjects.push(`${classData.subjects[sub].name} (${classData.name})`);
        }
      });

      panel.innerHTML = `
        <div class="detail-panel">
          <h3>${t.name} – Teacher Profile</h3>
          <p><strong>Email:</strong> ${t.email}</p>
          <p><strong>Subjects Assigned:</strong> ${subjects.join(", ") || "None"}</p>
          <button onclick="closePanel('teacherProfile')">Close</button>
        </div>
      `;
      panel.classList.add("active-panel");
    });
  });
}

function openStudentProfile(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const s = snap.val();
    const panel = document.getElementById("studentProfile");
    panel.innerHTML = `
      <div class="detail-panel">
        <h3>${s.name} – Student Profile</h3>
        <p><strong>Email:</strong> ${s.email}</p>
        <p><strong>Roll No:</strong> ${s.roll}</p>
        <p><strong>Class:</strong> ${s.classId}</p>
        <button onclick="closePanel('studentProfile')">Close</button>
      </div>
    `;
    panel.classList.add("active-panel");
  });
}

function openClassDetails(classId) {
  db.ref("classes/" + classId).once("value").then(snap => {
    const c = snap.val();
    const panel = document.getElementById("classPanel") || createClassPanel();

    let subjectList = "";
    for (let sub in c.subjects || {}) {
      subjectList += `<li>${c.subjects[sub].name} – Teacher ID: ${c.subjects[sub].teacherId}</li>`;
    }

    let studentList = "";
    for (let studentId in c.students || {}) {
      const s = c.students[studentId];
      studentList += `<li>${s.name} (Roll ${s.roll})</li>`;
    }

    panel.innerHTML = `
      <div class="detail-panel">
        <h3>${c.name} – Class Details</h3>
        <div><strong>Total Students:</strong> ${Object.keys(c.students || {}).length}</div>
        <h4>Subjects</h4>
        <ul>${subjectList || "<li>No subjects assigned</li>"}</ul>
        <button onclick="closePanel('classPanel')">Close</button>
      </div>
    `;
    panel.classList.add("active-panel");
  });
}

function createClassPanel() {
  const panel = document.createElement("div");
  panel.id = "classPanel";
  document.body.appendChild(panel);
  return panel;
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
