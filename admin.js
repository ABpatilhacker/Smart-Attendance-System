const auth = firebase.auth();
const db = firebase.database();

/* ===== AUTH CHECK ===== */
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
});

/* ===== SIDEBAR ===== */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

/* ===== LOGOUT ===== */
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/* ===== DASHBOARD ===== */
function showDashboard() {
  document.getElementById("content").innerHTML = `
    <h2>Admin Dashboard</h2>
    <p>Manage approvals, classes and teachers</p>
  `;
}

/* ===== PENDING APPROVAL ===== */
function showPending() {
  const content = document.getElementById("content");
  content.innerHTML = `<h2>Pending Users</h2><ul id="pendingList"></ul>`;

  const list = document.getElementById("pendingList");
  list.innerHTML = "";

  db.ref("pendingUsers").once("value").then(snap => {
    if (!snap.exists()) {
      list.innerHTML = "<li>No pending users</li>";
      return;
    }

    snap.forEach(child => {
      const u = child.val();
      const uid = child.key;

      const li = document.createElement("li");
      li.innerHTML = `
        ${u.name} (${u.role})
        <button onclick="approveUser('${uid}')">Approve</button>
      `;
      list.appendChild(li);
    });
  });
}

function approveUser(uid) {
  db.ref("pendingUsers/" + uid).once("value").then(snap => {
    const user = snap.val();

    db.ref("users/" + uid).set({
      name: user.name,
      email: user.email,
      role: user.role,
      approved: true
    });

    if (user.role === "teacher") {
      db.ref("teachers/" + uid).set({ name: user.name });
    }

    if (user.role === "student") {
      db.ref("students/" + uid).set({ name: user.name });
    }

    db.ref("pendingUsers/" + uid).remove();
    alert("User approved");
    showPending();
  });
}

/* ===== CLASSES ===== */
function showClasses() {
  document.getElementById("content").innerHTML = `
    <h2>Classes</h2>
    <input id="className" placeholder="Class Name">
    <button onclick="addClass()">Add Class</button>
    <ul id="classList"></ul>
  `;
  loadClasses();
}

function addClass() {
  const name = document.getElementById("className").value;
  if (!name) return alert("Enter class name");

  db.ref("classes/" + name).set({ subjects: {} });
  loadClasses();
}

function loadClasses() {
  const list = document.getElementById("classList");
  list.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c.key;
      list.appendChild(li);
    });
  });
}
