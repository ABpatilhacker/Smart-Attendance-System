// Overlay
const overlay = document.createElement("div");
overlay.className = "overlay";
document.body.appendChild(overlay);

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  overlay.classList.toggle("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  overlay.classList.remove("show");
}

overlay.addEventListener("click", closeSidebar);

// Menu handler (AUTO CLOSE FEATURE)
function handleMenu(type) {
  closeSidebar();

  if (type === "dashboard") showDashboard();
  if (type === "pending") showPending();
  if (type === "classes") showClasses();
}

function showDashboard() {
  document.getElementById("view").innerHTML = `
    <div class="card">
      <h3>📊 Dashboard Overview</h3>
      <p>Total Teachers: 12</p>
      <p>Total Students: 240</p>
      <p>Classes: 8</p>
    </div>
  `;
}

function showPending() {
  document.getElementById("view").innerHTML = `
    <div class="card">
      <h3>⏳ Pending Approvals</h3>
      <p>No pending approvals right now.</p>
    </div>
  `;
}

function showClasses() {
  document.getElementById("view").innerHTML = `
    <div class="card">
      <h3>🏫 Classes</h3>
      <p>BCA FY, SY, TY</p>
      <p>BSc CS FY, SY</p>
    </div>
  `;
}

function logout() {
  alert("Logged out");
  window.location.href = "login.html";
}

// Load dashboard by default
showDashboard();
