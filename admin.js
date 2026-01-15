// ------------------ GLOBAL ------------------
const auth = window.auth;
const db = window.db;
const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("view");

// ------------------ SIDEBAR ------------------
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ------------------ LOGOUT ------------------
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ------------------ KPIs ------------------
function showDashboard() {
  closeSidebar();
  mainView.innerHTML = `<h2>Dashboard Overview</h2><div class="card-grid" id="overview-cards"></div>`;
  const cards = document.getElementById("overview-cards");

  // Total Teachers
  db.ref("users").once("value").then(snap => {
    let teacherCount = 0, studentCount = 0, pendingCount = 0;
    snap.forEach(u => {
      const user = u.val();
      if(user.role === "teacher") teacherCount++;
      else if(user.role === "student") studentCount++;
      if(user.status === "pending") pendingCount++;
    });
    const totalClasses = Object.keys(snap.val() || {}).length;

    cards.innerHTML = `
      <div class="card overview-card">👨‍🏫 Total Teachers<br><strong>${teacherCount}</strong></div>
      <div class="card overview-card">👩‍🎓 Total Students<br><strong>${studentCount}</strong></div>
      <div class="card overview-card">🏫 Total Users<br><strong>${totalClasses}</strong></div>
      <div class="card overview-card">⏳ Pending Approvals<br><strong>${pendingCount}</strong></div>
    `;
  });
}

// ------------------ PENDING APPROVALS ------------------
function showPending() {
  closeSidebar();
  mainView.innerHTML = `<h2>Pending Approvals</h2><ul id="pending-list"></ul>`;
  const list = document.getElementById("pending-list");

  db.ref("users").once("value").then(snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const user = u.val();
      if(user.status === "pending") {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${user.name}</strong> (${user.role}) 
          <button onclick="approveUser('${u.key}')">Approve</button>
        `;
        list.appendChild(li);
      }
    });
  });
}

function approveUser(uid) {
  if(!confirm("Approve this user?")) return;
  db.ref(`users/${uid}/status`).set("approved").then(() => {
    showToast("User approved!");
    showPending();
  });
}

// ------------------ CREATE CLASS ------------------
function showClasses() {
  closeSidebar();
  mainView.innerHTML = `<h2>Create Class</h2>
    <div class="card">
      <input type="text" id="class-name" placeholder="Class Name" />
      <input type="text" id="class-subjects" placeholder="Subjects (comma separated)" />
      <button onclick="createClass()">Create Class</button>
    </div>
    <h2>Assign Teacher</h2>
    <div class="card">
      <select id="teacher-select"><option>Select Teacher</option></select>
      <select id="class-select"><option>Select Class</option></select>
      <button onclick="assignTeacher()">Assign Teacher</button>
    </div>`;
  
  // Fill Teacher Dropdown
  db.ref("users").once("value").then(snap => {
    const select = document.getElementById("teacher-select");
    snap.forEach(u => {
      const user = u.val();
      if(user.role === "teacher") {
        const opt = document.createElement("option");
        opt.value = u.key;
        opt.textContent = user.name;
        select.appendChild(opt);
      }
    });
  });

  // Fill Class Dropdown
  db.ref("classes").once("value").then(snap => {
    const select = document.getElementById("class-select");
    snap.forEach(c => {
      const cls = c.val();
      const opt = document.createElement("option");
      opt.value = c.key;
      opt.textContent = cls.name;
      select.appendChild(opt);
    });
  });
}

function createClass() {
  const name = document.getElementById("class-name").value.trim();
  const subjects = document.getElementById("class-subjects").value.trim();
  if(!name || !subjects) return showToast("Enter class name and subjects", "error");

  const classId = db.ref("classes").push().key;
  const subjectsObj = {};
  subjects.split(",").forEach((s,i) => subjectsObj["subject"+(i+1)] = s.trim());

  db.ref(`classes/${classId}`).set({ name, subjects: subjectsObj, createdAt: Date.now() })
    .then(() => {
      showToast("Class created!");
      showClasses();
    });
}

function assignTeacher() {
  const teacherId = document.getElementById("teacher-select").value;
  const classId = document.getElementById("class-select").value;
  if(teacherId === "Select Teacher" || classId === "Select Class") return showToast("Select both class and teacher", "error");

  db.ref(`classes/${classId}/teacher`).set(teacherId);
  db.ref(`users/${teacherId}/classes/${classId}`).set(true);
  showToast("Teacher assigned to class!");
}

// ------------------ TOAST ------------------
function showToast(msg, type="success") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add("show"),50);
  setTimeout(()=> { t.classList.remove("show"); setTimeout(()=>t.remove(),300)}, 2000);
             }
