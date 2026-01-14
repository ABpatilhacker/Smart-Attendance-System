// ---------------- GLOBAL ----------------
const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("view");

// ---------------- SIDEBAR ----------------
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ---------------- LOGOUT ----------------
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ---------------- TOAST ----------------
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ---------------- AUTH ----------------
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  showDashboard();
});

// ---------------- DASHBOARD ----------------
function showDashboard() {
  closeSidebar();
  mainView.innerHTML = `<h2>Dashboard Overview</h2>
    <div class="card-grid" id="overview-cards"></div>
  `;

  const cards = document.getElementById("overview-cards");

  // TOTAL CLASSES
  db.ref("classes").once("value").then(snap => {
    const totalClasses = snap.size || 0;
    const card1 = document.createElement("div");
    card1.className = "card overview-card";
    card1.innerHTML = `<h3>📚 Total Classes</h3><p>${totalClasses}</p>`;
    cards.appendChild(card1);

    // TOTAL TEACHERS
    db.ref("users").orderByChild("role").equalTo("teacher").once("value").then(tsnap => {
      const totalTeachers = tsnap.size || 0;
      const card2 = document.createElement("div");
      card2.className = "card overview-card";
      card2.innerHTML = `<h3>👨‍🏫 Total Teachers</h3><p>${totalTeachers}</p>`;
      cards.appendChild(card2);

      // TOTAL STUDENTS
      db.ref("users").orderByChild("role").equalTo("student").once("value").then(ssnap => {
        const totalStudents = ssnap.size || 0;
        const card3 = document.createElement("div");
        card3.className = "card overview-card";
        card3.innerHTML = `<h3>👩‍🎓 Total Students</h3><p>${totalStudents}</p>`;
        cards.appendChild(card3);

        // PENDING APPROVALS
        db.ref("users").orderByChild("status").equalTo("pending").once("value").then(psnap => {
          const pending = psnap.size || 0;
          const card4 = document.createElement("div");
          card4.className = "card overview-card";
          card4.innerHTML = `<h3>⏳ Pending Approvals</h3><p>${pending}</p>`;
          cards.appendChild(card4);
        });
      });
    });
  });
}

// ---------------- PENDING APPROVALS ----------------
function showPending() {
  closeSidebar();
  mainView.innerHTML = `<h2>Pending Approvals</h2><ul id="pending-list"></ul>`;
  const list = document.getElementById("pending-list");

  db.ref("users").orderByChild("status").equalTo("pending").once("value").then(snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const user = u.val();
      const li = document.createElement("li");
      li.className = "card pending-card";
      li.innerHTML = `
        <strong>${user.name}</strong> (${user.role})
        <button onclick="approveUser('${u.key}')">Approve</button>
      `;
      list.appendChild(li);
    });
  });
}

function approveUser(uid) {
  if (!confirm("Approve this user?")) return;
  db.ref(`users/${uid}/status`).set("approved").then(() => {
    showToast("User approved!");
    showPending();
  });
}

// ---------------- TEACHERS ----------------
function showTeachers() {
  closeSidebar();
  mainView.innerHTML = `<h2>Teachers</h2><div id="teacher-list" class="card-grid"></div>`;
  const list = document.getElementById("teacher-list");

  db.ref("users").orderByChild("role").equalTo("teacher").once("value").then(snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const teacher = u.val();
      const card = document.createElement("div");
      card.className = "card teacher-card";
      card.innerHTML = `
        <h3>${teacher.name}</h3>
        <p>Email: ${teacher.email}</p>
        <p>Classes: ${teacher.classes ? Object.keys(teacher.classes).join(", ") : "None"}</p>
      `;
      list.appendChild(card);
    });
  });
}

// ---------------- CLASSES ----------------
function showClasses() {
  closeSidebar();
  mainView.innerHTML = `<h2>Classes & Subjects</h2>
    <div id="classes-list" class="card-grid"></div>
    <button onclick="addClass()" class="btn primary">➕ Add Class</button>
  `;

  const list = document.getElementById("classes-list");
  db.ref("classes").once("value").then(snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      const cls = c.val();
      const card = document.createElement("div");
      card.className = "card class-card";
      card.innerHTML = `
        <h3>${cls.name}</h3>
        <p>Subjects: ${Object.values(cls.subjects || {}).join(", ")}</p>
        <p>Teacher: ${cls.teacher || "Unassigned"}</p>
      `;
      list.appendChild(card);
    });
  });
}

// ---------------- ADD CLASS ----------------
function addClass() {
  const className = prompt("Enter Class Name:");
  if (!className) return;
  const teacherEmail = prompt("Enter Teacher Email to Assign:");
  if (!teacherEmail) return;

  db.ref("users").orderByChild("email").equalTo(teacherEmail).once("value").then(tsnap => {
    if (!tsnap.exists()) return showToast("Teacher not found!", "error");
    const teacherId = Object.keys(tsnap.val())[0];

    const subjectStr = prompt("Enter Subjects (comma separated):");
    const subjects = {};
    subjectStr.split(",").forEach((s, i) => subjects[`subject${i+1}`] = s.trim());

    const newClassRef = db.ref("classes").push();
    newClassRef.set({
      name: className,
      subjects,
      teacher: teacherId,
      students: {}
    });

    // Add class to teacher
    db.ref(`users/${teacherId}/classes/${newClassRef.key}`).set(true);

    showToast("Class added successfully!");
    showClasses();
  });
}
