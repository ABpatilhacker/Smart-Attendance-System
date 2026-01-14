const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const view = document.getElementById("view");

function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

// Auth check
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  showDashboard();
});

// Logout
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ---------- DASHBOARD ----------
function showDashboard() {
  closeSidebar();
  view.innerHTML = `
    <h2>Overview</h2>
    <div class="card-grid" id="stats"></div>
  `;

  const stats = document.getElementById("stats");

  Promise.all([
    db.ref("users").once("value"),
    db.ref("classes").once("value")
  ]).then(([usersSnap, classSnap]) => {
    let teachers = 0, students = 0, pending = 0;

    usersSnap.forEach(u => {
      if (u.val().role === "teacher") teachers++;
      if (u.val().role === "student") students++;
      if (u.val().status === "pending") pending++;
    });

    stats.innerHTML = `
      <div class="card"><h3>👨‍🏫 Teachers</h3><p>${teachers}</p></div>
      <div class="card"><h3>🎓 Students</h3><p>${students}</p></div>
      <div class="card"><h3>🏫 Classes</h3><p>${classSnap.numChildren()}</p></div>
      <div class="card"><h3>⏳ Pending</h3><p>${pending}</p></div>
    `;
  });
}

// ---------- PENDING ----------
function showPending() {
  closeSidebar();
  view.innerHTML = `<h2>Pending Approvals</h2><div class="card-grid" id="pending"></div>`;
  const box = document.getElementById("pending");

  db.ref("users").once("value").then(snap => {
    box.innerHTML = "";
    snap.forEach(u => {
      const user = u.val();
      if (user.status === "pending") {
        box.innerHTML += `
          <div class="card">
            <h3>${user.name}</h3>
            <p>${user.role}</p>
            <button class="primary" onclick="approveUser('${u.key}')">Approve</button>
          </div>
        `;
      }
    });
  });
}

function approveUser(uid) {
  if (!confirm("Approve this user?")) return;
  db.ref("users/" + uid + "/status").set("approved").then(showPending);
}

// ---------- TEACHERS ----------
function showTeachers() {
  closeSidebar();
  view.innerHTML = `<h2>Teachers</h2><div class="card-grid" id="teachers"></div>`;
  const box = document.getElementById("teachers");

  db.ref("users").once("value").then(snap => {
    box.innerHTML = "";
    snap.forEach(u => {
      if (u.val().role === "teacher") {
        box.innerHTML += `
          <div class="card">
            <h3>${u.val().name}</h3>
            <p>Status: ${u.val().status}</p>
          </div>
        `;
      }
    });
  });
}

// ---------- CLASSES ----------
function showClasses() {
  closeSidebar();
  view.innerHTML = `<h2>Classes</h2><div class="card-grid" id="classes"></div>`;
  const box = document.getElementById("classes");

  db.ref("classes").once("value").then(snap => {
    box.innerHTML = "";
    snap.forEach(c => {
      box.innerHTML += `
        <div class="card">
          <h3>${c.val().name}</h3>
          <p>Students: ${Object.keys(c.val().students || {}).length}</p>
        </div>
      `;
    });
  });
}
