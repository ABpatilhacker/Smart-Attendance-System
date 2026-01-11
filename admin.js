function showDashboard() {
  document.getElementById("content").innerHTML = `
    <h2>Admin Dashboard</h2>
    <p>Overview of system</p>
  `;
}

function showTeachers() {
  document.getElementById("content").innerHTML = `
    <h2>Teachers</h2>
    <p>List of teachers will appear here.</p>
  `;
}

function showClasses() {
  document.getElementById("content").innerHTML = `
    <h2>Classes</h2>
    <p>Manage classes and subjects.</p>
  `;
}
