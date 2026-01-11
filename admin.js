const auth = firebase.auth();
const database = firebase.database();

/* SIDEBAR TOGGLE */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

/* LOGOUT */
function logout() {
  auth.signOut().then(() => {
    location.href = "index.html";
  });
}

/* DASHBOARD */
function showDashboard() {
  document.getElementById("content").innerHTML = `
    <h2>Dashboard</h2>
    <p>Admin controls teachers, classes and attendance system.</p>
  `;
}

/* TEACHERS */
function showTeachers() {
  document.getElementById("content").innerHTML = `
    <h2>Teachers</h2>
    <p>This section will manage teachers.</p>
  `;
}

/* CLASSES */
function showClasses() {
  document.getElementById("content").innerHTML = `
    <h2>Classes</h2>
    <p>This section will manage classes & subjects.</p>
  `;
}
