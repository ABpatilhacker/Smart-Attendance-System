console.log("dashboard.js loaded");

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function logout() {
  firebase.auth().signOut().then(() => {
    location.href = "index.html";
  });
}

function showDashboard() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <p>Welcome! Use sidebar to manage attendance.</p>
    </div>
  `;
}
