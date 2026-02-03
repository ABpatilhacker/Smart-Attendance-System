/*************************
 🔥 FIREBASE INIT
**************************/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/*************************
 🔐 AUTH GUARD
**************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Admin access only");
      auth.signOut();
      return;
    }

    loadDashboard();
    loadTeachers();
    loadClasses();
    loadSettings();
  });
});

/*************************
 🚪 LOGOUT (FIXED)
**************************/
function logout() {
  auth.signOut().then(() => {
    location.href = "login.html";
  });
}

/*************************
 📊 DASHBOARD COUNTS
**************************/
function loadDashboard() {
  // Classes count
  db.ref("classes").on("value", snap => {
    document.getElementById("classCount").innerText =
      snap.exists() ? snap.numChildren() : 0;
  });

  // Teachers + Students count
  db.ref("users").on("value", snap => {
    let teachers = 0;
    let students = 0;

    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) teachers++;
      if (d.role === "student" && d.approved) students++;
    });

    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });
}

/*************************
 👨‍🏫 TEACHERS PANEL
**************************/
function loadTeachers() {
  const list = document.getElementById("teacherList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";

    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher") {
        list.innerHTML += `
          <li>
            <strong>${d.name}</strong>
            <small>${d.email}</small>
            <span class="badge">${d.department || "—"}</span>
          </li>
        `;
      }
    });
  });
}

/*************************
 🏫 CLASSES PANEL
**************************/
function loadClasses() {
  const list = document.getElementById("classList");
  if (!list) return;

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";

    snap.forEach(c => {
      const cls = c.val();
      const studentCount = cls.students ? Object.keys(cls.students).length : 0;
      const subjectCount = cls.subjects ? Object.keys(cls.subjects).length : 0;

      list.innerHTML += `
        <li>
          <strong>${cls.name}</strong>
          <div class="meta">
            <span>👨‍🎓 ${studentCount} Students</span>
            <span>📘 ${subjectCount} Subjects</span>
          </div>
          <button onclick="viewClass('${c.key}')">View</button>
        </li>
      `;
    });
  });
}

/*************************
 📘 VIEW CLASS DETAILS
**************************/
function viewClass(classId) {
  db.ref("classes/" + classId).once("value").then(snap => {
    const cls = snap.val();
    let html = `<h2>${cls.name}</h2>`;

    // Subjects
    html += `<h3>Subjects</h3><ul>`;
    for (let s in cls.subjects) {
      html += `<li>${cls.subjects[s].name}</li>`;
    }
    html += `</ul>`;

    // Students
    html += `<h3>Students</h3><ul>`;
    for (let st in cls.students) {
      html += `<li>${cls.students[st].roll}. ${cls.students[st].name}</li>`;
    }
    html += `</ul>`;

    document.getElementById("classPanel").innerHTML =
      html + `<button onclick="closePanel('classPanel')">Close</button>`;

    openPanel("classPanel");
  });
}

/*************************
 ⚙️ SETTINGS
**************************/
function loadSettings() {
  db.ref("settings/minAttendance").once("value", snap => {
    document.getElementById("minAttendance").value =
      snap.exists() ? snap.val() : 75;
  });
}

function saveSettings() {
  const v = Number(document.getElementById("minAttendance").value);
  if (v < 0 || v > 100) {
    alert("Attendance must be between 0–100");
    return;
  }

  db.ref("settings").update({ minAttendance: v })
    .then(() => alert("Settings saved"));
}

/*************************
 🧭 UI HELPERS
**************************/
function nav(id) {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
}

function openPanel(id) {
  document.getElementById(id).classList.add("active-panel");
}

function closePanel(id) {
  document.getElementById(id).classList.remove("active-panel");
   }
